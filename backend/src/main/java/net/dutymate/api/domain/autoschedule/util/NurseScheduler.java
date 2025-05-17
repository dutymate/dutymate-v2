package net.dutymate.api.domain.autoschedule.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.rule.Rule;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.WorkIntensity;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;

import lombok.Builder;
import lombok.Getter;

@Component
public class NurseScheduler {

	private static final double INITIAL_TEMPERATURE = 1000.0;
	private static final double COOLING_RATE = 0.995;
	private static final int MAX_ITERATIONS = 300000;
	private static final int MAX_NO_IMPROVEMENT = 6000;
	private static final Random random = new Random();

	public WardSchedule generateSchedule(WardSchedule wardSchedule,
		Rule rule,
		List<WardMember> wardMembers,
		List<WardSchedule.NurseShift> prevNurseShifts,
		YearMonth yearMonth,
		Long currentMemberId,
		List<Request> requests,
		Map<Integer, Integer> dailyNightCnt,
		List<Long> reinforcementRequestIds,
		Map<Long, WorkIntensity> workIntensities,
		Map<Long, Integer> nurseShiftFlags) {
		Map<Long, String> prevMonthSchedules = getPreviousMonthSchedules(prevNurseShifts);
		Solution currentSolution = createInitialSolution(
			rule, wardMembers, yearMonth, dailyNightCnt,
			prevMonthSchedules, workIntensities, nurseShiftFlags
		);
		Solution bestSolution = currentSolution.copy();

		List<Long> safeReinforcementIds = reinforcementRequestIds != null
			? reinforcementRequestIds : Collections.emptyList();

		List<ShiftRequest> shiftRequests = requests.stream()
			.map(request -> ShiftRequest.builder()
				.requestId(request.getRequestId())
				.nurseId(request.getWardMember().getMember().getMemberId())
				.day(request.getRequestDate().getDate())
				.requestedShift(request.getRequestShift().getValue().charAt(0))
				.isReinforced(safeReinforcementIds.contains(request.getRequestId()))
				.build())
			.toList();

		double currentScore = evaluateSolution(currentSolution, rule, prevMonthSchedules, shiftRequests,
			workIntensities);
		double bestScore = currentScore;
		double temperature = INITIAL_TEMPERATURE;
		int noImprovementCount = 0;
		for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
			Solution neighborSolution = generateNeighborSolution(currentSolution, prevMonthSchedules, rule);
			double neighborScore = evaluateSolution(neighborSolution, rule, prevMonthSchedules, shiftRequests,
				workIntensities);

			if (acceptSolution(currentScore, neighborScore, temperature)) {
				currentSolution = neighborSolution;
				currentScore = neighborScore;

				if (currentScore < bestScore) {
					bestSolution = currentSolution.copy();
					bestScore = currentScore;
					noImprovementCount = 0;
				} else {
					noImprovementCount++;
				}
			}

			if (noImprovementCount > MAX_NO_IMPROVEMENT) {
				temperature = INITIAL_TEMPERATURE;
				noImprovementCount = 0;
			} else {
				temperature *= COOLING_RATE;
			}
		}

		return applyFinalSchedule(wardSchedule, bestSolution, currentMemberId);
	}

	private Solution createInitialSolution(
		Rule rule,
		List<WardMember> wardMembers,
		YearMonth yearMonth,
		Map<Integer, Integer> dailyNightCnt,
		Map<Long, String> prevMonthSchedules,
		Map<Long, WorkIntensity> workIntensities,
		Map<Long, Integer> nurseShiftFlags) {

		Map<Integer, Solution.DailyRequirement> requirements = calculateDailyRequirements(rule, yearMonth,
			dailyNightCnt);

		// 간호사 초기화 (모두 오프로 시작) - 비트마스킹 정보 포함
		List<Solution.Nurse> nurses = initializeNurses(wardMembers, yearMonth.daysInMonth(),
			nurseShiftFlags);

		// 이전 달 마지막 근무와의 연속성 고려
		considerPreviousMonthContinuity(nurses, prevMonthSchedules, rule);

		// 특정 근무 타입만 가능한 간호사 먼저 처리 (Night 전담, Day 전담 등)
		// handleSpecificShiftNurses(nurses, yearMonth, dailyNightCnt);

		// 나머지 날짜에 대한 근무 배정 (워크 인텐시티 고려)
		for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
			if (hasNoAssignmentsForDay(nurses, day)) {
				assignShiftsForDay(nurses, day, requirements.get(day), workIntensities);
			}
		}

		return Solution.builder()
			.daysInMonth(yearMonth.daysInMonth())
			.nurses(nurses)
			.dailyRequirements(requirements)
			.build();
	}

	private void sortNursesByWorkIntensity(List<Solution.Nurse> nurses, Map<Long, WorkIntensity> workIntensities) {
		nurses.sort((n1, n2) -> {
			WorkIntensity i1 = workIntensities.getOrDefault(n1.getId(), WorkIntensity.MEDIUM);
			WorkIntensity i2 = workIntensities.getOrDefault(n2.getId(), WorkIntensity.MEDIUM);

			// HIGH가 우선, LOW가 나중
			if (i1 == WorkIntensity.HIGH && i2 != WorkIntensity.HIGH) {
				return -1;
			}
			if (i1 != WorkIntensity.HIGH && i2 == WorkIntensity.HIGH) {
				return 1;
			}
			if (i1 == WorkIntensity.MEDIUM && i2 == WorkIntensity.LOW) {
				return -1;
			}
			if (i1 == WorkIntensity.LOW && i2 == WorkIntensity.MEDIUM) {
				return 1;
			}

			return 0;
		});
	}

	public Map<Long, String> getPreviousMonthSchedules(List<WardSchedule.NurseShift> prevNurseShifts) {
		Map<Long, String> prevMonthSchedules = new HashMap<>();
		if (prevNurseShifts != null) {
			for (WardSchedule.NurseShift shift : prevNurseShifts) {
				String shifts = shift.getShifts();
				if (shifts.length() >= 4) {
					prevMonthSchedules.put(shift.getMemberId(),
						shifts.substring(shifts.length() - 4));
				}
			}
		}
		return prevMonthSchedules;
	}

	/**
	 * 워크 인텐시티에 따라 휴일 배분을 조정합니다.
	 */
	private void adjustOffDaysBasedOnWorkIntensity(
		List<Solution.Nurse> nurses,
		Map<Long, Integer> adjustedOffDays,
		int daysInMonth) {

		for (Solution.Nurse nurse : nurses) {
			int targetOffDays = adjustedOffDays.getOrDefault(nurse.getId(), daysInMonth / 4);
			int currentOffDays = countOffDays(nurse.getShifts());

			if (currentOffDays == targetOffDays) {
				continue; // 이미 목표와 일치하면 조정 불필요
			}

			if (currentOffDays < targetOffDays) {
				// 휴일 추가 필요
				addOffDays(nurse, targetOffDays - currentOffDays);
			} else {
				// 휴일 감소 필요
				removeOffDays(nurse, currentOffDays - targetOffDays);
			}
		}
	}

	/**
	 * 현재 휴일(O) 일수를 계산합니다.
	 */
	private int countOffDays(char[] shifts) {
		int count = 0;
		for (char shift : shifts) {
			if (shift == 'O') {
				count++;
			}
		}
		return count;
	}

	/**
	 * 간호사의 스케줄에 휴일을 추가합니다.
	 */
	private void addOffDays(Solution.Nurse nurse, int daysToAdd) {
		// 우선순위: 연속 근무일을 피하고, 주중에 우선 배치
		List<Integer> eligibleDays = new ArrayList<>();
		char[] shifts = nurse.getShifts();

		// 먼저 연속 근무일 찾기
		for (int i = 1; i < shifts.length - 1; i++) {
			if (shifts[i] != 'O' && shifts[i - 1] != 'O' && shifts[i + 1] != 'O') {
				eligibleDays.add(i);
			}
		}

		// 연속 근무일이 충분하지 않으면 일반 근무일도 고려
		if (eligibleDays.size() < daysToAdd) {
			for (int i = 0; i < shifts.length; i++) {
				if (shifts[i] != 'O' && !eligibleDays.contains(i)) {
					eligibleDays.add(i);
				}
			}
		}

		// 랜덤으로 휴일 추가
		Collections.shuffle(eligibleDays);
		for (int i = 0; i < Math.min(daysToAdd, eligibleDays.size()); i++) {
			int dayIndex = eligibleDays.get(i);
			nurse.setShift(dayIndex + 1, 'O');
		}
	}

	/**
	 * 간호사의 스케줄에서 휴일을 제거합니다.
	 */
	private void removeOffDays(Solution.Nurse nurse, int daysToRemove) {
		// 우선순위: 연속 휴일을 피하고, 주말보다 주중 휴일 우선 제거
		List<Integer> eligibleDays = new ArrayList<>();
		char[] shifts = nurse.getShifts();

		// 먼저 연속 휴일 찾기
		for (int i = 1; i < shifts.length - 1; i++) {
			if (shifts[i] == 'O' && shifts[i - 1] == 'O' && shifts[i + 1] == 'O') {
				eligibleDays.add(i);
			}
		}

		// 연속 휴일이 충분하지 않으면 일반 휴일도 고려
		if (eligibleDays.size() < daysToRemove) {
			for (int i = 0; i < shifts.length; i++) {
				if (shifts[i] == 'O' && !eligibleDays.contains(i)) {
					eligibleDays.add(i);
				}
			}
		}

		// 랜덤으로 휴일 제거 (다양한 근무 유형 고려)
		Collections.shuffle(eligibleDays);
		for (int i = 0; i < Math.min(daysToRemove, eligibleDays.size()); i++) {
			int dayIndex = eligibleDays.get(i);

			// 간호사의 가능한 근무 유형에 따라 대체할 근무 선택
			List<Character> possibleShifts = new ArrayList<>();
			if (nurse.canWorkShift('D')) {
				possibleShifts.add('D');
			}
			if (nurse.canWorkShift('E')) {
				possibleShifts.add('E');
			}
			if (nurse.canWorkShift('N')) {
				possibleShifts.add('N');
			}

			if (possibleShifts.isEmpty()) {
				continue; // 가능한 근무 유형이 없으면 건너뜀
			}

			char newShift = possibleShifts.get(random.nextInt(possibleShifts.size()));
			nurse.setShift(dayIndex + 1, newShift);
		}
	}

	private void considerPreviousMonthContinuity(List<Solution.Nurse> nurses,
		Map<Long, String> prevMonthSchedules,
		Rule rule) {
		for (Solution.Nurse nurse : nurses) {
			String prevSchedule = prevMonthSchedules.get(nurse.getId());
			if (prevSchedule != null && !prevSchedule.isEmpty()) {
				char lastPrevShift = prevSchedule.charAt(prevSchedule.length() - 1);

				// 이전 달 마지막 날이 야간 근무인 경우
				if (lastPrevShift == 'N') {
					// 실제 연속 야간 근무 일수 계산 (전체 이전 달 스케줄 체크)
					int consecutiveNights = 1; // 이전 달 마지막 날 포함
					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
						if (prevSchedule.charAt(i) == 'N') {
							consecutiveNights++;
						} else {
							break; // 연속이 끊기면 중단
						}
					}

					// 연속 야간 근무가 최대치에 도달했는지 확인
					if (consecutiveNights >= rule.getMaxN()) {
						// 최대 연속 야간 근무 초과하거나 도달한 경우 무조건 휴무
						nurse.setShift(1, 'O'); // 첫날은 휴무

						// 특별히 연속 야간 후 필요한 추가 휴식 적용
						int extraRestDays = rule.getOffCntAfterN();
						for (int day = 1; day <= Math.min(extraRestDays, nurse.getShifts().length); day++) {
							nurse.setShift(day, 'O');
						}
					} else if (nurse.canWorkShift('N')) {
						// 아직 최대치에 도달하지 않았고 야간 근무 가능한 경우
						int remainingAllowedNights = rule.getMaxN() - consecutiveNights;

						// 수정: 연속성 확률 낮춤 (이전 0.7)
						if (remainingAllowedNights > 0 && random.nextDouble() < 0.5) {
							nurse.setShift(1, 'N'); // 첫날도 야간 근무 계속

							// 수정: 최대 1일만 추가로 배정 (이전 최대 2일)
							int additionalNights = Math.min(remainingAllowedNights - 1, 1);
							for (int day = 2; day <= additionalNights + 1 && day <= nurse.getShifts().length; day++) {
								// 수정: 확률 낮춤 (이전 0.8)
								if (random.nextDouble() < 0.6) {
									nurse.setShift(day, 'N');
								} else {
									nurse.setShift(day, 'O'); // 휴무로 전환
									break; // 연속 중단
								}
							}

							// 연속 야간 후 필요한 휴식 추가
							int totalNights = consecutiveNights + additionalNights;
							if (totalNights >= rule.getMaxN() - 1) { // 수정: 더 엄격한 조건
								int reset = additionalNights + 2;
								int restDays = rule.getOffCntAfterN();
								int length = nurse.getShifts().length;
								for (int day = reset; day < reset + restDays && day <= length; day++) {
									nurse.setShift(day, 'O');
								}
							}
						} else {
							// 연속성 중단, 휴무로 전환
							nurse.setShift(1, 'O'); // 첫날은 휴무
						}
					} else {
						// 야간 근무 불가능한 경우
						nurse.setShift(1, 'O'); // 첫날은 무조건 휴무
					}
				} else if (lastPrevShift == 'D' || lastPrevShift == 'E') {
					// 연속 근무 일수 계산
					int consecutiveWorkDays = 1; // 이전 달 마지막 날 포함
					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
						char shift = prevSchedule.charAt(i);
						if (shift != 'O' && shift != 'X') {
							consecutiveWorkDays++;
						} else {
							break;
						}
					}

					// 근무 연속성 처리
					if (consecutiveWorkDays >= rule.getMaxShift()) {
						// 최대 연속 근무일 도달 시 휴무
						nurse.setShift(1, 'O');

						// 최대 연속 근무 후 필요한 휴식 적용
						int restDays = rule.getOffCntAfterMaxShift();
						for (int day = 1; day <= Math.min(restDays, nurse.getShifts().length); day++) {
							nurse.setShift(day, 'O');
						}
					} else {
						// 생체리듬 보호를 위해 같은 유형 유지 시도
						int remainingWorkDays = rule.getMaxShift() - consecutiveWorkDays;

						if (remainingWorkDays > 0) {
							double continuityProb = 0.0;
							char preferredShift = 'O';

							// 근무 유형별 생체리듬 보호 로직
							if (lastPrevShift == 'D') {
								continuityProb = 0.7; // 70% 확률로 주간 연속
								preferredShift = 'D';
							} else {
								continuityProb = 0.6; // 60% 확률로 저녁 연속
								preferredShift = 'E';
							}

							if (random.nextDouble() < continuityProb && nurse.canWorkShift(preferredShift)) {
								nurse.setShift(1, preferredShift); // 같은 유형 유지

								// 너무 긴 연속 근무는 피함
								if (consecutiveWorkDays + 1 >= rule.getMaxShift() && nurse.getShifts().length > 1) {
									nurse.setShift(2, 'O'); // 둘째날은 휴무
								}
							} else if (lastPrevShift == 'E' && nurse.canWorkShift('N') && random.nextDouble() < 0.3) {
								// E→N은 생체리듬상 허용 가능 (저녁→야간)

								// 야간 근무는 최소 연속 근무 일수를 보장해야 함
								int minNights = rule.getMinN();
								if (nurse.getShifts().length >= minNights) {
									// 첫날 야간 배정
									nurse.setShift(1, 'N');

									// 최소 야간 일수만큼 연속 배정
									for (int day = 2; day <= minNights && day <= nurse.getShifts().length; day++) {
										nurse.setShift(day, 'N');
									}

									// 필요한 경우 휴식 보장
									if (nurse.getShifts().length > minNights) {
										nurse.setShift(minNights + 1, 'O');
									}
								} else {
									// 최소 야간 일수를 채울 수 없으면 야간 배정하지 않음
									nurse.setShift(1, 'O');
								}
							} else {
								// 아니면 휴무
								nurse.setShift(1, 'O');
							}
						} else {
							nurse.setShift(1, 'O'); // 휴무
						}
					}
				} else if (lastPrevShift == 'O' || lastPrevShift == 'X' || lastPrevShift == 'M') {
					// 미드 근무도 휴무처럼 처리 (자동 생성 로직에서 제외)
					// 휴무 연속 일수 확인 (미드 근무는 연속성을 고려하지 않음)
					int consecutiveOffs = 1; // 이전 달 마지막 날 포함 (미드나 휴무)
					if (lastPrevShift == 'O' || lastPrevShift == 'X') {
						for (int i = prevSchedule.length() - 2; i >= 0; i--) {
							if (prevSchedule.charAt(i) == 'O' || prevSchedule.charAt(i) == 'X') {
								consecutiveOffs++;
							} else {
								break;
							}
						}
					}

					// 가능한 근무 유형 목록 생성 (미드 제외)
					List<Character> possibleShifts = new ArrayList<>();
					if (nurse.canWorkShift('D')) {
						possibleShifts.add('D');
					}
					if (nurse.canWorkShift('E')) {
						possibleShifts.add('E');
					}

					// 야간 근무는 최소 연속 일수가 보장될 수 있는 경우만 후보로 추가
					if (nurse.canWorkShift('N')) {
						int minNights = rule.getMinN();
						boolean canEnsureMinNights = true;

						// 최소 야간 근무 일수를 확보할 수 있는지 확인
						for (int day = 1; day <= minNights && day <= nurse.getShifts().length; day++) {
							if (nurse.getShift(day) != 'O' && nurse.getShift(day) != 'X') {
								canEnsureMinNights = false;
								break;
							}
						}

						if (canEnsureMinNights && nurse.getShifts().length >= minNights) {
							possibleShifts.add('N');
						}
					}

					possibleShifts.add('O'); // 휴무 연장도 가능

					// 너무 긴 휴무는 근무로 전환 시도 (미드인 경우는 고려하지 않음)
					if (lastPrevShift != 'M' && consecutiveOffs > 3) {
						// 오래 쉬었으면 근무 재개 확률 높임
						if (!possibleShifts.isEmpty() && possibleShifts.size() > 1) {
							// 휴무 옵션 제거
							possibleShifts.remove(Character.valueOf('O'));

							// 근무 유형에 가중치 부여
							double rand = random.nextDouble();
							char selectedShift;

							if (rand < 0.7 && possibleShifts.contains('D')) { // 주간 70%
								selectedShift = 'D';
							} else if (rand < 0.95 && possibleShifts.contains('E')) { // 저녁 25%
								selectedShift = 'E';
							} else if (possibleShifts.contains('N')) { // 야간 5% (낮은 확률)
								selectedShift = 'N';

								// 야간이 선택된 경우 최소 연속 일수 보장
								nurse.setShift(1, 'N');
								int minNights = rule.getMinN();

								// 최소 야간 일수만큼 연속 배정
								for (int day = 2; day <= minNights && day <= nurse.getShifts().length; day++) {
									nurse.setShift(day, 'N');
								}

								// 필요한 경우 휴식 보장
								if (nurse.getShifts().length > minNights) {
									nurse.setShift(minNights + 1, 'O');
								}

								continue; // 야간 근무 특별 처리 완료, 다음 간호사로
							} else if (!possibleShifts.isEmpty()) {
								selectedShift = possibleShifts.get(0);
							} else {
								selectedShift = 'O'; // 기본값
							}

							nurse.setShift(1, selectedShift);
						} else if (!possibleShifts.isEmpty()) {
							nurse.setShift(1, possibleShifts.get(0));
						}
					} else {
						// 적절한 휴식 기간이거나 미드 근무인 경우 정상 배정
						if (!possibleShifts.isEmpty()) {
							double rand = random.nextDouble();

							if (rand < 0.5 && possibleShifts.contains('D')) { // 주간 50%
								nurse.setShift(1, 'D');
							} else if (rand < 0.85 && possibleShifts.contains('E')) { // 저녁 35%
								nurse.setShift(1, 'E');
							} else if (rand < 0.95 && possibleShifts.contains('N')) { // 야간 10%
								// 야간 선택 시 최소 연속 일수 보장
								nurse.setShift(1, 'N');
								int minNights = rule.getMinN();

								// 최소 야간 일수만큼 연속 배정
								for (int day = 2; day <= minNights && day <= nurse.getShifts().length; day++) {
									nurse.setShift(day, 'N');
								}

								// 필요한 경우 휴식 보장
								if (nurse.getShifts().length > minNights) {
									nurse.setShift(minNights + 1, 'O');
								}

								continue; // 야간 근무 특별 처리 완료, 다음 간호사로
							} else if (possibleShifts.contains('O')) { // 휴무 5%
								nurse.setShift(1, 'O');
							} else {
								// 가능한 근무 중 선택
								nurse.setShift(1, possibleShifts.get(random.nextInt(possibleShifts.size())));
							}
						}
					}
				}
			}
		}
	}

	private Map<Integer, Solution.DailyRequirement> calculateDailyRequirements(Rule rule, YearMonth yearMonth,
		Map<Integer, Integer> dailyNightCnt) {
		Map<Integer, Solution.DailyRequirement> requirements = new HashMap<>();
		for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
			boolean isWeekend = yearMonth.isWeekend(day);
			requirements.put(day, Solution.DailyRequirement.builder()
				.dayNurses(isWeekend ? rule.getWendDCnt() : rule.getWdayDCnt())
				.eveningNurses(isWeekend ? rule.getWendECnt() : rule.getWdayECnt())
				.nightNurses(isWeekend
					? (rule.getWendNCnt() - dailyNightCnt.getOrDefault(day, 0))
					: (rule.getWdayNCnt() - dailyNightCnt.getOrDefault(day, 0)))
				.build());
		}
		return requirements;
	}

	private List<Solution.Nurse> initializeNurses(List<WardMember> wardMembers,
		int daysInMonth,
		Map<Long, Integer> nurseShiftFlags) {
		return wardMembers.stream()
			.map(wm -> {
				Long memberId = wm.getMember().getMemberId();
				char[] shifts = new char[daysInMonth];
				// String existingShifts = existingSchedules.get(memberId);

				Arrays.fill(shifts, 'O');

				int shiftFlag = nurseShiftFlags.getOrDefault(memberId, ShiftType.ALL.getFlag());

				return Solution.Nurse.builder()
					.id(memberId)
					.shifts(shifts)
					.shiftFlags(shiftFlag)
					.build();
			})
			.collect(Collectors.toList());
	}

	private void assignShiftsForDay(List<Solution.Nurse> nurses, int day, Solution.DailyRequirement requirement,
		Map<Long, WorkIntensity> workIntensities) {
		// 일별 필요 인원 수 체크
		Map<Character, Integer> currentAssignments = countShiftsForDay(nurses, day);

		int remainingDayNurses = Math.max(0, requirement.getDayNurses() - currentAssignments.getOrDefault('D', 0));
		int remainingEveningNurses = Math.max(0,
			requirement.getEveningNurses() - currentAssignments.getOrDefault('E', 0));
		int remainingNightNurses = Math.max(0, requirement.getNightNurses() - currentAssignments.getOrDefault('N', 0));

		// 사용 가능한 간호사 목록 가져오기
		List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day);

		// 특정 근무 타입 전담이 아닌 간호사만 필터링 (전담 간호사는 이미 처리됨)
		availableNurses = availableNurses.stream()
			.filter(nurse -> nurse.getShiftFlags() != ShiftType.D.getFlag()
				&& nurse.getShiftFlags() != ShiftType.E.getFlag()
				&& nurse.getShiftFlags() != ShiftType.N.getFlag()
				&& nurse.getShiftFlags() != ShiftType.M.getFlag())
			.collect(Collectors.toList());

		// 근무 강도에 따라 간호사 정렬 (HIGH 강도가 먼저 배정받음)
		sortNursesByWorkIntensity(availableNurses, workIntensities);

		// 필요한 인원만 배정
		if (remainingNightNurses > 0) {
			assignSpecificShift(availableNurses, day, 'N', remainingNightNurses);
		}

		if (remainingDayNurses > 0) {
			assignSpecificShift(availableNurses, day, 'D', remainingDayNurses);
		}

		if (remainingEveningNurses > 0) {
			assignSpecificShift(availableNurses, day, 'E', remainingEveningNurses);
		}

		// 남은 간호사들은 자동으로 오프(O)로 유지됨
	}

	private void assignSpecificShift(List<Solution.Nurse> availableNurses, int day, char shiftType, int required) {
		// 필요한 인원 수가 0이면 배정하지 않음
		if (required <= 0 || availableNurses.isEmpty()) {
			return;
		}

		// 해당 근무 유형이 가능한 간호사만 필터링
		List<Solution.Nurse> eligibleNurses = availableNurses.stream()
			.filter(nurse -> nurse.canWorkShift(shiftType))
			.collect(Collectors.toList());

		if (eligibleNurses.isEmpty()) {
			return; // 해당 근무 유형 가능한 간호사가 없음
		}

		if (shiftType == 'N') {
			assignNightShifts(eligibleNurses, day, required);
		} else {
			for (int i = 0; i < required && !eligibleNurses.isEmpty(); i++) {
				int nurseIdx = random.nextInt(eligibleNurses.size());
				Solution.Nurse nurse = eligibleNurses.get(nurseIdx);
				nurse.setShift(day, shiftType);
				// 원래 목록에서도 제거
				availableNurses.remove(nurse);
				eligibleNurses.remove(nurseIdx);
			}
		}
	}

	private void assignNightShifts(List<Solution.Nurse> availableNurses, int day, int required) {
		int remainingRequired = required;
		List<Solution.Nurse> assignedNurses = new ArrayList<>();

		// 1. 먼저 기존 야간 근무 연장 시도
		Iterator<Solution.Nurse> iterator = availableNurses.iterator();
		while (iterator.hasNext() && remainingRequired > 0) {
			Solution.Nurse nurse = iterator.next();
			if (day > 1 && nurse.getShift(day - 1) == 'N' && nurse.canWorkShift('N')) {
				nurse.setShift(day, 'N');
				assignedNurses.add(nurse);
				iterator.remove();
				remainingRequired--;
			}
		}

		// 2. 추가 야간 간호사가 필요하고 짝수 날짜인 경우, 새로운 2일 연속 근무 시작 시도
		if (remainingRequired > 0 && day % 2 == 0) {
			List<Solution.Nurse> consecutiveCandidates = new ArrayList<>(availableNurses);
			while (remainingRequired > 0 && !consecutiveCandidates.isEmpty()) {
				int idx = random.nextInt(consecutiveCandidates.size());
				Solution.Nurse nurse = consecutiveCandidates.get(idx);

				if (isNurseAvailableForConsecutiveNights(nurse, day - 1)) {
					nurse.setShift(day - 1, 'N');
					nurse.setShift(day, 'N');
					assignedNurses.add(nurse);
					availableNurses.remove(nurse);
					consecutiveCandidates.remove(idx);
					remainingRequired--;
				} else {
					consecutiveCandidates.remove(idx);
				}
			}
		}

		// 3. 여전히 간호사가 필요한 경우, 남은 가능한 간호사들에게 배정
		while (remainingRequired > 0 && !availableNurses.isEmpty()) {
			int idx = random.nextInt(availableNurses.size());
			Solution.Nurse nurse = availableNurses.get(idx);

			// 가능한 경우 연속 야간 근무 설정
			nurse.setShift(day, 'N');
			if (day < nurse.getShifts().length - 1
				&& isNurseAvailableForConsecutiveNights(nurse, day)) {
				nurse.setShift(day + 1, 'N');
			}

			availableNurses.remove(idx);
			remainingRequired--;
		}
	}

	private boolean isNurseAvailableForConsecutiveNights(Solution.Nurse nurse, int day) {
		// 간호사가 연속 야간 근무 가능한지 확인
		if (day + 1 > nurse.getShifts().length || !nurse.canWorkShift('N')) {
			return false;
		}

		// 이전 근무 확인
		if (day > 1) {
			char previousShift = nurse.getShift(day - 1);
			if (previousShift != 'O' && previousShift != 'X') {
				return false;
			}
		}

		// 이후 근무 확인
		if (day + 2 <= nurse.getShifts().length) {
			char followingShift = nurse.getShift(day + 2);
			return followingShift == 'O' || followingShift == 'X';
		}

		return true;
	}

	private double evaluateSolution(Solution solution, Rule rule, Map<Long, String> prevMonthSchedules,
		List<ShiftRequest> requests, Map<Long, WorkIntensity> workIntensities) {
		double score = 0;

		// 강한 제약 조건
		score += evaluateShiftRequirements(solution) * 20000;
		score += evaluateConsecutiveShifts(solution, rule) * 15000;
		score += evaluatePreviousMonthConstraints(solution, prevMonthSchedules, rule) * 10000;
		score += evaluateShiftTypeConstraints(solution) * 10000; // 근무 유형 제약 (높은 가중치)
		score += evaluateShiftRequests(solution, requests) * 5000;
		score += evaluateShiftPatterns(solution) * 5000;

		// 약한 제약 조건
		score += evaluateNodPatterns(solution, prevMonthSchedules) * 3000;
		score += evaluateWorkloadBalance(solution) * 1000;
		score += evaluateWorkIntensityBalance(solution, workIntensities) * 2000;
		score += evaluateAlternatingWorkPattern(solution) * 500;
		score += evaluateShiftConsistency(solution) * 1000; // 3000 가중치로 설정

		return score;
	}

	private void modifyAlternatingPattern(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		Solution.Nurse nurse = nurses.get(nurseIdx);
		char[] shifts = nurse.getShifts();

		// 근무-휴무 패턴 찾기
		List<Integer> patternStarts = new ArrayList<>();

		for (int i = 0; i < shifts.length - 3; i++) {
			if (shifts[i] != 'O'
				&& shifts[i] != 'X'
				&& (shifts[i + 1] == 'O' || shifts[i + 1] == 'X')
				&& shifts[i + 2] != 'O' && shifts[i + 2] != 'X'
				&& (shifts[i + 3] == 'O' || shifts[i + 3] == 'X')) {

				patternStarts.add(i);
				i += 3; // 다음 검색은 이 패턴 이후부터
			}
		}

		if (patternStarts.isEmpty()) {
			return;
		}

		// 랜덤하게 패턴 선택
		int startIdx = patternStarts.get(random.nextInt(patternStarts.size()));

		// 패턴 수정 전략 선택
		int strategy = random.nextInt(4);

		switch (strategy) {
			case 0:
				// 전략 1: 연속 근무로 변경 (첫번째 근무 + 휴무를 모두 근무로)
				if (startIdx + 1 < shifts.length) {
					char workShift = shifts[startIdx];
					if (nurse.canWorkShift(workShift)) {
						nurse.setShift(startIdx + 2, workShift);
					}
				}
				break;
			case 1:
				// 전략 2: 연속 휴무로 변경 (두번째 근무 + 휴무를 모두 휴무로)
				if (startIdx + 3 < shifts.length) {
					nurse.setShift(startIdx + 3, 'O');
				}
				break;
			case 2:
				// 전략 3: 첫번째 근무 유형 변경
				if (startIdx + 2 < shifts.length) {
					char currentShift = shifts[startIdx + 2];
					if (nurse.canWorkShift(currentShift)) {
						nurse.setShift(startIdx + 1, currentShift);
					}
				}
				break;
			case 3:
				// 전략 4: 두번째 근무 유형 변경
				if (startIdx < shifts.length) {
					char currentShift = shifts[startIdx];
					if (nurse.canWorkShift(currentShift)) {
						nurse.setShift(startIdx + 3, currentShift);
					}
				}
				break;
		}
	}

	// 근무 유형 제약 조건 평가 메서드 (새로 추가)
	private double evaluateShiftTypeConstraints(Solution solution) {
		double violations = 0;

		for (Solution.Nurse nurse : solution.getNurses()) {
			// 특정 근무 타입만 가능한 간호사 처리
			boolean isSpecificShiftNurse = nurse.getShiftFlags() == ShiftType.D.getFlag()
				|| nurse.getShiftFlags() == ShiftType.E.getFlag()
				|| nurse.getShiftFlags() == ShiftType.N.getFlag()
				|| nurse.getShiftFlags() == ShiftType.M.getFlag();

			for (int day = 1; day <= solution.getDaysInMonth(); day++) {
				char shift = nurse.getShift(day);

				// 근무 불가능한 유형이 배정된 경우 패널티
				if (!nurse.canWorkShift(shift) && shift != 'O' && shift != 'X') {
					violations += 200; // 높은 패널티
				}

				// 특정 근무 타입만 가능한 간호사가 다른 근무를 하는 경우 더 높은 패널티
				if (isSpecificShiftNurse && shift != 'O' && shift != 'X') {
					int nurseShiftFlag = nurse.getShiftFlags();
					boolean isValidShift = false;

					switch (shift) {
						case 'D':
							isValidShift = (nurseShiftFlag & ShiftType.D.getFlag()) != 0;
							break;
						case 'E':
							isValidShift = (nurseShiftFlag & ShiftType.E.getFlag()) != 0;
							break;
						case 'N':
							isValidShift = (nurseShiftFlag & ShiftType.N.getFlag()) != 0;
							break;
						case 'M':
							isValidShift = (nurseShiftFlag & ShiftType.M.getFlag()) != 0;
							break;
					}

					if (!isValidShift) {
						violations += 500; // 매우 높은 패널티
					}
				}
			}
		}

		return violations;
	}

	private double evaluateNodPatterns(Solution solution, Map<Long, String> prevMonthSchedules) {
		double violations = 0;

		// 기존 월내 NOD 패턴 체크
		for (Solution.Nurse nurse : solution.getNurses()) {
			for (int day = 1; day <= solution.getDaysInMonth() - 2; day++) {
				if (nurse.hasNodPattern(day - 1)) {
					violations += 10;
				}
			}

			// 월말-월초 NOD 패턴 체크
			String prevSchedule = prevMonthSchedules.get(nurse.getId());
			if (prevSchedule != null && prevSchedule.length() >= 2) {
				// 이전 달 마지막 날이 N
				if (prevSchedule.charAt(prevSchedule.length() - 1) == 'N') {
					// 현재 달 첫날이 O
					if (solution.getDaysInMonth() >= 2 && nurse.getShift(1) == 'O') {
						// 현재 달 둘째날이 D -> NOD 패턴
						if (nurse.getShift(2) == 'D') {
							violations += 20; // 월말-월초 NOD 패턴에 더 높은 패널티
						}
					}
				}
			}
		}

		return violations;
	}

	/**
	 * 워크 인텐시티에 따른 휴일 배분 적절성을 평가합니다.
	 */
	private double evaluateWorkIntensityBalance(Solution solution, Map<Long, WorkIntensity> workIntensities) {
		double violations = 0;
		int daysInMonth = solution.getDaysInMonth();

		// LOW 강도 간호사만 있는지 확인
		boolean onlyLowExists = solution.getNurses().stream()
			.allMatch(nurse -> workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM) == WorkIntensity.LOW);

		// 전체 근무 배정 현황 계산
		Map<Long, Map<Character, Integer>> nurseShiftCounts = new HashMap<>();

		for (Solution.Nurse nurse : solution.getNurses()) {
			Map<Character, Integer> counts = new HashMap<>();
			for (char shift : nurse.getShifts()) {
				counts.merge(shift, 1, Integer::sum);
			}
			nurseShiftCounts.put(nurse.getId(), counts);
		}

		// 워크 인텐시티에 따른 평가
		for (Solution.Nurse nurse : solution.getNurses()) {
			WorkIntensity intensity = workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM);
			Map<Character, Integer> counts = nurseShiftCounts.get(nurse.getId());

			// 근무 일수 비율 계산 (D + E + N)
			int workDays = counts.getOrDefault('D', 0) + counts.getOrDefault('E', 0) + counts.getOrDefault('N', 0);
			double workRatio = (double)workDays / daysInMonth;

			// 각 근무 강도별 목표 근무 비율
			double targetRatio;
			switch (intensity) {
				case HIGH:
					targetRatio = 0.7; // 70% 근무 (HIGH는 더 많이 근무)
					break;
				case LOW:
					targetRatio = 0.5; // 50% 근무 (LOW는 덜 근무)
					break;
				case MEDIUM:
				default:
					targetRatio = 0.6; // 60% 근무 (중간 정도 근무)
					break;
			}

			// 목표 비율과의 차이에 따른 페널티
			double diff = Math.abs(workRatio - targetRatio);

			// 강도별 다른 가중치 적용
			if (intensity == WorkIntensity.LOW) {
				// LOW 강도 간호사에게 더 높은 가중치 적용
				double weightMultiplier = 3.0; // 3배 가중치

				// LOW 강도 간호사만 있는 경우 추가 가중치 적용
				if (onlyLowExists) {
					weightMultiplier = 5.0; // 5배 가중치
				}

				// 목표보다 더 많이 일하는 경우 (workRatio > targetRatio) 페널티 추가
				if (workRatio > targetRatio) {
					weightMultiplier *= 1.5; // 추가 50% 페널티
				}

				violations += diff * 100 * weightMultiplier;
			} else if (intensity == WorkIntensity.HIGH) {
				// HIGH 강도 간호사는 일반 가중치
				violations += diff * 100;
			} else {
				// MEDIUM 강도 간호사는 일반 가중치
				violations += diff * 100;
			}
		}

		return violations;
	}

	private double evaluateShiftRequirements(Solution solution) {
		double violations = 0;
		for (int day = 1; day <= solution.getDaysInMonth(); day++) {
			Map<Character, Integer> counts = countShiftsForDay(solution.getNurses(), day);
			Solution.DailyRequirement req = solution.getDailyRequirements().get(day);

			// 야간 근무 위반은 더 높은 패널티 부여
			int nightDiff = Math.abs(counts.getOrDefault('N', 0) - req.getNightNurses());
			violations += nightDiff * 50; // 야간 근무 위반에 50배 패널티

			// 일반 근무 요구사항 위반
			violations += Math.abs(counts.getOrDefault('D', 0) - req.getDayNurses());
			violations += Math.abs(counts.getOrDefault('E', 0) - req.getEveningNurses());
		}
		return violations;
	}

	private double evaluatePreviousMonthConstraints(Solution solution, Map<Long, String> prevMonthSchedules,
		Rule rule) {
		double violations = 0;

		for (Solution.Nurse nurse : solution.getNurses()) {
			String prevSchedule = prevMonthSchedules.get(nurse.getId());
			if (prevSchedule != null && !prevSchedule.isEmpty()) {
				char lastPrevShift = prevSchedule.charAt(prevSchedule.length() - 1);
				char firstCurrentShift = nurse.getShift(1);

				// 이전 달 마지막 날이 야간 근무인 경우
				if (lastPrevShift == 'N') {
					// 야간 -> 주간/저녁 패턴은 위반 (야간 근무 후 바로 주간이나 저녁 근무 불가)
					if (firstCurrentShift == 'D' || firstCurrentShift == 'E') {
						violations += 100;  // 높은 패널티
					}

					// 야간 근무 후 바로 휴무가 아닌 경우 (N -> O 아닌 경우) 패널티
					// 단, 야간 연속성 (N -> N)은 예외로 검사
					if (firstCurrentShift != 'O' && firstCurrentShift != 'N') {
						violations += 50;
					}

					// 야간 연속성 체크 (이전 달 마지막과 이번 달이 연속될 때만)
					if (firstCurrentShift == 'N') {
						// 이전 달 연속 야간 근무 일수 계산
						int prevMonthConsecutiveNights = 1; // 마지막 날
						for (int i = prevSchedule.length() - 2; i >= 0; i--) {
							if (prevSchedule.charAt(i) == 'N') {
								prevMonthConsecutiveNights++;
							} else {
								break;
							}
						}

						// 현재 달 연속 야간 근무 일수 계산
						int currentMonthConsecutiveNights = 1; // 첫날
						for (int day = 2; day <= solution.getDaysInMonth(); day++) {
							if (nurse.getShift(day) == 'N') {
								currentMonthConsecutiveNights++;
							} else {
								break;
							}
						}

						// 전체 연속 야간 근무 일수
						int totalConsecutiveNights =
							prevMonthConsecutiveNights + currentMonthConsecutiveNights - 1; // 중복 카운트 방지

						// 최대 연속 야간 초과 시 패널티 (매우 높은 패널티 적용)
						if (totalConsecutiveNights > rule.getMaxN()) {
							violations += (totalConsecutiveNights - rule.getMaxN()) * 30;
						}
					}

					// NOD 패턴 체크: 이전 달 마지막 날 N, 첫날 O, 둘째날 D인 경우
					if (firstCurrentShift == 'O' && solution.getDaysInMonth() >= 2) {
						if (nurse.getShift(2) == 'D') {
							violations += 40; // NOD 패턴에 높은 패널티
						}
					}
				}

				// 연속 근무일수 체크
				int consecutiveShifts = 0;
				// 이전 달 마지막 부분 체크
				for (int i = prevSchedule.length() - 1; i >= 0; i--) {
					char shift = prevSchedule.charAt(i);
					if (shift != 'O' && shift != 'X') {
						consecutiveShifts++;
					} else {
						break;
					}
				}

				// 현재 달 시작 부분 체크
				for (int day = 1; day <= solution.getDaysInMonth(); day++) {
					char shift = nurse.getShift(day);
					if (shift != 'O' && shift != 'X') {
						consecutiveShifts++;
					} else {
						break;
					}
				}

				// 최대 연속 근무일수(rule.getMaxShift()) 초과시 패널티
				if (consecutiveShifts > rule.getMaxShift()) {
					violations += (consecutiveShifts - rule.getMaxShift()) * 5;  // 가중치 5 적용
				}

				// 야간 연속 근무 체크
				if (lastPrevShift == 'N' && firstCurrentShift == 'N') {
					int consecutiveNights = 1; // 이전 달 마지막 날 포함
					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
						if (prevSchedule.charAt(i) == 'N') {
							consecutiveNights++;
						} else {
							break;
						}
					}
					for (int day = 2; day <= solution.getDaysInMonth(); day++) {
						if (nurse.getShift(day) == 'N') {
							consecutiveNights++;
						} else {
							break;
						}
					}
					if (consecutiveNights > rule.getMaxN()) {
						violations += (consecutiveNights - rule.getMaxN()) * 8; // 가중치 8 적용
					}

					// 단일 야간 근무 체크 (이전 달 마지막 N, 현재 달 첫날 N, 둘째날 야간 아님)
					if (solution.getDaysInMonth() >= 2 && nurse.getShift(2) != 'N') {
						// 이전 달의 N이 단일이었는지 확인
						boolean wasSingleNight = prevSchedule.length() < 2
							|| prevSchedule.charAt(prevSchedule.length() - 2) != 'N';

						// 현재 단일 야간이라면 (연속 2일만 N)
						if (wasSingleNight) {
							violations += 15; // 단일 야간 패널티
						}
					}
				}

				// 이전 달 마지막과 현재 달 첫날의 근무 패턴 체크
				if (lastPrevShift == 'E' && firstCurrentShift == 'D') {
					violations += 10; // 저녁->주간 패턴에 패널티
				}
			}
		}

		return violations;
	}

	private double evaluateConsecutiveShifts(Solution solution, Rule rule) {
		double violations = 0;
		for (Solution.Nurse nurse : solution.getNurses()) {
			int consecutiveShifts = 0;
			int consecutiveNights = 0;
			int consecutiveOffs = 0;  // 연속 휴무 일수 추적
			int maxConsecutiveOffs = 3;  // 최대 허용 연속 휴무 일수 (조정 가능)

			for (int day = 1; day <= solution.getDaysInMonth(); day++) {
				char shift = nurse.getShift(day);
				if (shift == 'O' || shift == 'X') {
					// 휴식일 발생
					consecutiveOffs++;

					// 휴식일 발생시 단일 야간 패턴 확인
					if (consecutiveNights == 1) {
						violations += 10;
					}
					consecutiveShifts = 0;
					consecutiveNights = 0;
				} else {
					// 너무 긴 연속 휴무에 대한 패널티 부여
					if (consecutiveOffs > maxConsecutiveOffs) {
						violations += (consecutiveOffs - maxConsecutiveOffs) * 5;  // 초과 일수당 5점 패널티
					}
					consecutiveOffs = 0;  // 근무일이 시작되면 연속 휴무 카운트 리셋

					consecutiveShifts++;
					if (shift == 'N') {
						consecutiveNights++;
					} else {
						// 단일 야간 근무에 높은 패널티 부여
						if (consecutiveNights == 1) {
							violations += 15; // 단일 야간 근무에 대한 패널티 증가
						}
						consecutiveNights = 0;
					}
				}

				if (consecutiveShifts > rule.getMaxShift()) {
					violations++;
				}
				if (consecutiveNights > rule.getMaxN()) {
					violations += 15;
				}
			}

			// 월말 최종 확인
			if (consecutiveNights == 1) {
				violations += 15;
			}

			if (consecutiveShifts == 1) {
				violations += 10;
			}

			// 월말에 연속 휴무 확인
			if (consecutiveOffs > maxConsecutiveOffs) {
				violations += (consecutiveOffs - maxConsecutiveOffs) * 5;
			}
		}
		return violations;
	}

	// 연속 근무 시 같은 유형의 근무를 유지하는지 평가하는 함수
	private double evaluateShiftConsistency(Solution solution) {
		double violations = 0;

		for (Solution.Nurse nurse : solution.getNurses()) {
			char[] shifts = nurse.getShifts();
			char currentShiftType = 'X'; // 초기값
			int consecutiveWorkDays = 0;
			int shiftTypeChanges = 0;

			for (int day = 0; day < shifts.length; day++) {
				char shift = shifts[day];

				// 근무일인 경우 (O와 X가 아닌 경우)
				if (shift != 'O' && shift != 'X') {
					consecutiveWorkDays++;

					// 이전에도 근무일이었다면 유형 변경 체크
					if (consecutiveWorkDays > 1) {
						if (currentShiftType != shift && currentShiftType != 'X') {
							shiftTypeChanges++;

							// 연속 근무 길이에 따라 다른 패널티 적용
							// 2~4일 연속 근무에서 유형 변경시 더 높은 패널티
							if (consecutiveWorkDays >= 2 && consecutiveWorkDays <= 4) {
								violations += 5; // 높은 패널티
							} else {
								violations += 2; // 일반 패널티
							}
						}
					}

					currentShiftType = shift;
				} else {
					// 휴무일이 시작되면 연속 근무 카운터 초기화
					consecutiveWorkDays = 0;
					currentShiftType = 'X';
				}
			}
		}

		return violations;
	}

	private double evaluateShiftPatterns(Solution solution) {
		double violations = 0;
		for (Solution.Nurse nurse : solution.getNurses()) {
			for (int day = 2; day <= solution.getDaysInMonth(); day++) {
				char prevShift = nurse.getShift(day - 1);
				char currentShift = nurse.getShift(day);

				if (prevShift == 'N' && (currentShift == 'D' || currentShift == 'E')) {
					violations += 2;
				}
				if (prevShift == 'E' && currentShift == 'D') {
					violations++;
				}
			}
		}
		return violations;
	}

	private double evaluateWorkloadBalance(Solution solution) {
		Map<Character, List<Integer>> shiftCounts = new HashMap<>();
		for (Solution.Nurse nurse : solution.getNurses()) {
			Map<Character, Integer> counts = new HashMap<>();
			for (char shift : nurse.getShifts()) {
				counts.merge(shift, 1, Integer::sum);
			}
			for (Map.Entry<Character, Integer> entry : counts.entrySet()) {
				shiftCounts.computeIfAbsent(entry.getKey(), k -> new ArrayList<>())
					.add(entry.getValue());
			}
		}

		return shiftCounts.values().stream()
			.mapToDouble(this::calculateStandardDeviation)
			.sum();
	}

	private double calculateStandardDeviation(List<Integer> numbers) {
		double mean = numbers.stream().mapToInt(i -> i).average().orElse(0);
		return Math.sqrt(numbers.stream()
			.mapToDouble(i -> Math.pow(i - mean, 2))
			.average()
			.orElse(0));
	}

	private Map<Character, Integer> countShiftsForDay(List<Solution.Nurse> nurses, int day) {
		return nurses.stream()
			.collect(Collectors.groupingBy(
				nurse -> nurse.getShift(day),
				Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
			));
	}

	private WardSchedule applyFinalSchedule(WardSchedule wardSchedule, Solution solution, Long currentMemberId) {
		List<WardSchedule.NurseShift> nurseShifts = solution.getNurses().stream()
			.map(nurse -> WardSchedule.NurseShift.builder()
				.memberId(nurse.getId())
				.shifts(new String(nurse.getShifts()))
				.build())
			.collect(Collectors.toList());

		WardSchedule.History history = WardSchedule.History.builder()
			.memberId(currentMemberId)
			.name("auto")
			.before("X")
			.after("X")
			.modifiedDay(0)
			.isAutoCreated(true)
			.build();

		WardSchedule.Duty newDuty = WardSchedule.Duty.builder()
			.idx(wardSchedule.getNowIdx() + 1)
			.duty(nurseShifts)
			.history(history)
			.build();

		List<WardSchedule.Duty> duties = wardSchedule.getDuties().subList(0, wardSchedule.getNowIdx() + 1);

		duties.add(newDuty);

		return WardSchedule.builder()
			.id(wardSchedule.getId())
			.wardId(wardSchedule.getWardId())
			.year(wardSchedule.getYear())
			.month(wardSchedule.getMonth())
			.nowIdx(wardSchedule.getNowIdx() + 1)
			.duties(duties)
			.build();
	}

	private Solution generateNeighborSolution(Solution current, Map<Long, String> prevMonthSchedules, Rule rule) {
		Solution neighbor = current.copy();
		List<Solution.Nurse> nurses = neighbor.getNurses();

		// 기존 케이스에 월말-월초 패턴 처리 케이스 추가
		switch (random.nextInt(8)) {  // 케이스 하나 더 추가해서 8로 변경
			case 0: // 두 간호사 간 근무 교환
				swapNurseShifts(nurses);
				break;
			case 1: // 한 간호사의 근무 유형 변경
				changeShiftType(nurses);
				break;
			case 2: // 근무 시퀀스 교환
				swapShiftSequence(nurses);
				break;
			case 3: // NOD 패턴 생성 또는 제거 시도
				modifyNodPattern(nurses);
				break;
			case 4: // 야간 근무 패턴 수정
				modifyNightShiftPattern(nurses);
				break;
			case 5: // 월말-월초 패턴 처리
				fixMonthTransitionPatterns(nurses, prevMonthSchedules, rule);
				break;
			case 6: // 근무-휴무 반복 패턴 수정
				modifyAlternatingPattern(nurses);
				break;
			case 7: // 연속 근무 유형 일관성 개선 (새로 추가)
				improveShiftConsistency(nurses);
				break;
		}

		return neighbor;
	}

	private void improveShiftConsistency(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		Solution.Nurse nurse = nurses.get(nurseIdx);
		char[] shifts = nurse.getShifts();

		// 유형이 변경되는 연속 근무 시퀀스를 찾습니다
		List<Integer> inconsistentDays = new ArrayList<>();

		char prevShift = 'X';
		int consecutiveWorkDays = 0;

		for (int day = 0; day < shifts.length; day++) {
			char shift = shifts[day];

			if (shift != 'O' && shift != 'X') {
				consecutiveWorkDays++;

				// 이전과 다른 근무 유형이고, 연속 근무 중일 때 (2일 이상 연속 근무)
				if (prevShift != 'X' && prevShift != shift && prevShift != 'O' && consecutiveWorkDays > 1) {
					inconsistentDays.add(day);
				}

				prevShift = shift;
			} else {
				consecutiveWorkDays = 0;
				prevShift = 'X';
			}
		}

		if (inconsistentDays.isEmpty()) {
			return;
		}

		// 무작위로 선택한 불일치 지점을 수정
		int dayToFix = inconsistentDays.get(random.nextInt(inconsistentDays.size()));

		// 앞쪽 근무 유형 또는 뒤쪽 근무 유형 중 하나로 통일
		boolean useForwardType = random.nextBoolean();

		// 앞으로 또는 뒤로 연속적인 근무일 찾기
		int startDay;
		int endDay;

		// 앞으로 찾기 (현재 위치부터 이전 휴무일까지)
		for (startDay = dayToFix - 1; startDay >= 0; startDay--) {
			if (shifts[startDay] == 'O' || shifts[startDay] == 'X') {
				break;
			}
		}
		startDay++; // 실제 근무 시작일

		// 뒤로 찾기 (현재 위치부터 다음 휴무일까지)
		for (endDay = dayToFix; endDay < shifts.length; endDay++) {
			if (shifts[endDay] == 'O' || shifts[endDay] == 'X') {
				break;
			}
		}
		endDay--; // 실제 근무 종료일

		if (startDay <= endDay) {
			// 통일할 근무 유형 결정
			char unifiedType;
			if (useForwardType) {
				unifiedType = shifts[startDay]; // 앞쪽 근무 유형
			} else {
				unifiedType = shifts[endDay]; // 뒤쪽 근무 유형
			}

			// 간호사가 해당 근무 유형을 수행할 수 있는지 확인
			if (nurse.canWorkShift(unifiedType)) {
				// 시퀀스 내 모든 근무를 동일한 유형으로 설정
				for (int i = startDay; i <= endDay; i++) {
					nurse.setShift(i + 1, unifiedType); // setShift는 1부터 시작하므로 +1
				}
			}
		}
	}

	private void fixMonthTransitionPatterns(List<Solution.Nurse> nurses, Map<Long, String> prevMonthSchedules,
		Rule rule) {
		if (nurses.isEmpty()) {
			return;
		}

		// 이전 달 마지막 날이 야간 근무인 간호사 찾기
		List<Solution.Nurse> nightEndNurses = new ArrayList<>();
		for (Solution.Nurse nurse : nurses) {
			String prevSchedule = prevMonthSchedules.get(nurse.getId());
			if (prevSchedule != null && !prevSchedule.isEmpty()
				&& prevSchedule.charAt(prevSchedule.length() - 1) == 'N') {
				nightEndNurses.add(nurse);
			}
		}

		if (!nightEndNurses.isEmpty()) {
			// 모든 대상 간호사를 처리
			for (Solution.Nurse nurse : nightEndNurses) {
				// 이전 달 연속 야간 일수 계산
				String prevSchedule = prevMonthSchedules.get(nurse.getId());
				int prevConsecutiveNights = 1; // 마지막 날 포함
				for (int i = prevSchedule.length() - 2; i >= 0; i--) {
					if (prevSchedule.charAt(i) == 'N') {
						prevConsecutiveNights++;
					} else {
						break;
					}
				}

				// 최대 연속 야간 근무 초과 여부 확인
				if (prevConsecutiveNights >= rule.getMaxN() - 1) { // 수정: 더 엄격한 조건 적용
					// 첫날은 반드시 휴무
					nurse.setShift(1, 'O');

					// 추가 휴식일 적용
					int restDays = rule.getOffCntAfterN();
					for (int day = 1; day <= Math.min(restDays, nurse.getShifts().length); day++) {
						nurse.setShift(day, 'O');
					}

					// 둘째날도 NOD 패턴 방지를 위해 설정
					if (nurse.getShifts().length > restDays) {
						List<Character> safeShifts = new ArrayList<>();
						if (nurse.canWorkShift('E')) {
							safeShifts.add('E');
						}
						safeShifts.add('O');

						nurse.setShift(restDays + 1, safeShifts.get(random.nextInt(safeShifts.size())));
					}
				} else if (nurse.canWorkShift('N')) {
					// 첫날 야간인지 확인
					boolean isFirstDayNight = nurse.getShift(1) == 'N';

					// 수정: 더 엄격한 연속 야간 관리
					if (isFirstDayNight) {
						// 현재 달 연속 야간 계산
						int currentConsecutiveNights = 1; // 첫날 포함
						for (int day = 2; day <= nurse.getShifts().length; day++) {
							if (nurse.getShift(day) == 'N') {
								currentConsecutiveNights++;
							} else {
								break;
							}
						}

						// 전체 연속 야간 계산 (중복 제거)
						int totalConsecutiveNights = prevConsecutiveNights + currentConsecutiveNights - 1;

						// 수정: 최대치에 근접하거나 초과하면 즉시 조정
						if (totalConsecutiveNights >= rule.getMaxN()) {
							// 앞에서부터 수정 (연속성 즉시 끊기)
							nurse.setShift(1, 'O');

							// 휴식일 보장
							int restDays = rule.getOffCntAfterN();
							for (int day = 1; day <= Math.min(restDays, nurse.getShifts().length); day++) {
								nurse.setShift(day, 'O');
							}
						} else if (totalConsecutiveNights >= rule.getMaxN() - 1) {
							// 최대 1일까지만 허용하고 그 이후는 휴식
							for (int day = 2; day <= nurse.getShifts().length; day++) {
								if (day > 1) { // 첫날은 이미 N으로 설정됨
									nurse.setShift(day, 'O');
								}
							}

							// 추가 휴식일 보장
							int restDays = rule.getOffCntAfterN();
							for (int day = 2; day < 2 + restDays && day <= nurse.getShifts().length; day++) {
								nurse.setShift(day, 'O');
							}
						}
					}
				}
			}
		}
	}

	private void modifyNightShiftPattern(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		// 야간 근무 가능한 간호사만 필터링
		List<Solution.Nurse> nightEligibleNurses = nurses.stream()
			.filter(nurse -> nurse.canWorkShift('N'))
			.toList();
		if (nightEligibleNurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nightEligibleNurses.size());
		Solution.Nurse nurse = nightEligibleNurses.get(nurseIdx);

		// 배열 길이를 고려하여 안전한 startDay 선택
		int maxStartDay = nurse.getShifts().length - 2;
		if (maxStartDay < 1) {
			return; // 배열이 너무 작으면 수정하지 않음
		}

		int startDay = 1 + random.nextInt(maxStartDay); // 1부터 시작하도록 수정

		// 단일 야간 근무를 찾아 연속으로 만들기
		for (int day = startDay; day < nurse.getShifts().length - 1; day++) {
			if (isValidDay(day, nurse.getShifts().length)
				&& isValidDay(day + 1, nurse.getShifts().length)) {

				if (nurse.getShift(day) == 'N' && nurse.getShift(day + 1) != 'N') {
					// 연속 야간 근무가 가능한지 확인
					if (isNurseAvailableForConsecutiveNights(nurse, day)) {
						nurse.setShift(day + 1, 'N');
						break;
					}
				}
			}
		}
	}

	private boolean isValidDay(int day, int maxDays) {
		return day > 0 && day <= maxDays;
	}

	private void swapNurseShifts(List<Solution.Nurse> nurses) {
		if (nurses.size() < 2) {
			return;
		}

		int nurse1Idx = random.nextInt(nurses.size());
		int nurse2Idx = random.nextInt(nurses.size() - 1);
		if (nurse2Idx >= nurse1Idx) {
			nurse2Idx++;
		}

		int day = random.nextInt(nurses.get(0).getShifts().length);

		// 두 간호사 모두 해당 근무 유형을 수행할 수 있는지 확인
		Solution.Nurse nurse1 = nurses.get(nurse1Idx);
		Solution.Nurse nurse2 = nurses.get(nurse2Idx);

		char shift1 = nurse1.getShift(day + 1);
		char shift2 = nurse2.getShift(day + 1);

		if (nurse2.canWorkShift(shift1) && nurse1.canWorkShift(shift2)) {
			// 두 간호사 모두 서로의 근무 유형 수행 가능한 경우에만 교환
			nurse1.setShift(day + 1, shift2);
			nurse2.setShift(day + 1, shift1);
		}
	}

	private void changeShiftType(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		int day = random.nextInt(nurses.get(0).getShifts().length);
		Solution.Nurse nurse = nurses.get(nurseIdx);

		// 해당 간호사가 가능한 근무 유형만 선택
		List<Character> possibleShifts = new ArrayList<>();
		if (nurse.canWorkShift('D')) {
			possibleShifts.add('D');
		}
		if (nurse.canWorkShift('E')) {
			possibleShifts.add('E');
		}
		if (nurse.canWorkShift('N')) {
			possibleShifts.add('N');
		}
		possibleShifts.add('O'); // 휴무는 항상 가능

		char newShift = possibleShifts.get(random.nextInt(possibleShifts.size()));
		nurse.setShift(day + 1, newShift);
	}

	private void swapShiftSequence(List<Solution.Nurse> nurses) {
		if (nurses.size() < 2) {
			return;
		}

		int nurse1Idx = random.nextInt(nurses.size());
		int nurse2Idx = random.nextInt(nurses.size() - 1);
		if (nurse2Idx >= nurse1Idx) {
			nurse2Idx++;
		}

		int startDay = random.nextInt(nurses.get(0).getShifts().length - 2);
		int length = random.nextInt(3) + 1;

		Solution.Nurse nurse1 = nurses.get(nurse1Idx);
		Solution.Nurse nurse2 = nurses.get(nurse2Idx);

		// 시퀀스 교환 전에 근무 가능 여부 확인
		boolean canSwap = true;
		for (int i = 0; i < length && (startDay + i) < nurse1.getShifts().length; i++) {
			char shift1 = nurse1.getShift(startDay + i + 1);
			char shift2 = nurse2.getShift(startDay + i + 1);

			if (!nurse2.canWorkShift(shift1) || !nurse1.canWorkShift(shift2)) {
				canSwap = false;
				break;
			}
		}

		// 두 간호사가 서로의 근무 유형 수행 가능한 경우에만 교환
		if (canSwap) {
			for (int i = 0; i < length && (startDay + i) < nurse1.getShifts().length; i++) {
				char temp = nurse1.getShift(startDay + i + 1);
				nurse1.setShift(startDay + i + 1, nurse2.getShift(startDay + i + 1));
				nurse2.setShift(startDay + i + 1, temp);
			}
		}
	}

	private double evaluateAlternatingWorkPattern(Solution solution) {
		double violations = 0;

		for (Solution.Nurse nurse : solution.getNurses()) {
			char[] shifts = nurse.getShifts();

			// 최소 4일 이상의 패턴이 필요함 (근무-휴무-근무-휴무)
			for (int i = 0; i < shifts.length - 3; i++) {
				// 근무-휴무-근무-휴무 패턴 체크
				if (shifts[i] != 'O' && shifts[i] != 'X'
					&& (shifts[i + 1] == 'O' || shifts[i + 1] == 'X')
					&& shifts[i + 2] != 'O' && shifts[i + 2] != 'X'
					&& (shifts[i + 3] == 'O' || shifts[i + 3] == 'X')) {

					// 더 긴 패턴도 체크 (패턴이 계속되는지)
					int patternLength = 2; // 기본 패턴 길이 (근무-휴무)
					for (int j = i + 4; j < shifts.length - 1; j += 2) {
						if (shifts[j] != 'O' && shifts[j] != 'X'
							&& (shifts[j + 1] == 'O' || shifts[j + 1] == 'X')) {
							patternLength++;
						} else {
							break;
						}
					}

					// 패턴이 길수록 더 큰 패널티 부여
					violations += patternLength * 2;

					// 이미 패턴을 찾았으니 다음 검색은 패턴 이후부터
					i += patternLength * 2 - 1;
				}
			}
		}

		return violations;
	}

	private void modifyNodPattern(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		Solution.Nurse nurse = nurses.get(nurseIdx);
		int startDay = random.nextInt(nurse.getShifts().length - 2);

		if (nurse.hasNodPattern(startDay)) {
			// NOD 패턴 제거를 위해 근무 중 하나 변경
			int dayToChange = random.nextInt(3);
			List<Character> alternatives = new ArrayList<>();

			// 변경 가능한 대체 근무 유형 결정
			if (dayToChange == 0) { // N 변경
				if (nurse.canWorkShift('E')) {
					alternatives.add('E');
				}
				if (nurse.canWorkShift('D')) {
					alternatives.add('D');
				}
			} else if (dayToChange == 1) { // O 변경
				if (nurse.canWorkShift('E')) {
					alternatives.add('E');
				}
				if (nurse.canWorkShift('N')) {
					alternatives.add('N');
				}
				if (nurse.canWorkShift('D')) {
					alternatives.add('D');
				}
			} else { // D 변경
				if (nurse.canWorkShift('E')) {
					alternatives.add('E');
				}
				if (nurse.canWorkShift('N')) {
					alternatives.add('N');
				}
				alternatives.add('O');
			}

			if (!alternatives.isEmpty()) {
				nurse.setShift(startDay + dayToChange + 1,
					alternatives.get(random.nextInt(alternatives.size())));
			}
		} else {
			// NOD 패턴 생성 시도 (간호사가 N, D 둘 다 가능한 경우만)
			if (nurse.canWorkShift('N') && nurse.canWorkShift('D')) {
				nurse.setShift(startDay + 1, 'N');
				nurse.setShift(startDay + 2, 'O');
				nurse.setShift(startDay + 3, 'D');
			}
		}
	}

	private boolean acceptSolution(double currentScore, double neighborScore, double temperature) {
		if (neighborScore < currentScore) {
			return true;
		}

		// 요구사항을 위반하는 나쁜 해결책을 받아들이기 어렵게 만듦
		double delta = neighborScore - currentScore;
		if (delta > 10000) { // 차이가 큰 경우 (요구사항 위반 의미)
			temperature *= 0.5; // 온도를 낮춰서 받아들이기 어렵게 함
		}

		double probability = Math.exp(-delta / temperature);
		return random.nextDouble() < probability;
	}

	private List<Solution.Nurse> getAvailableNursesForDay(List<Solution.Nurse> nurses, int day) {
		return nurses.stream()
			.filter(nurse -> isNurseAvailableForDay(nurse, day))
			.collect(Collectors.toList());
	}

	private boolean isNurseAvailableForDay(Solution.Nurse nurse, int day) {
		if (day > 1 && nurse.getShift(day - 1) == 'N') {
			return false;
		}

		int consecutiveShifts = 0;
		for (int i = Math.max(1, day - 5); i < day; i++) {
			char shift = nurse.getShift(i);
			if (shift != 'O' && shift != 'X') {
				consecutiveShifts++;
			} else {
				consecutiveShifts = 0;
			}
		}
		return consecutiveShifts < 5;
	}

	private boolean hasNoAssignmentsForDay(List<Solution.Nurse> nurses, int day) {
		return nurses.stream()
			.map(nurse -> nurse.getShift(day))
			.allMatch(shift -> shift == 'O' || shift == 'X');
	}

	// 필요한 총 간호사 수 계산
	public int neededNurseCount(YearMonth yearMonth, Rule rule, int nightNurseCnt) {
		// 평일/주말 필요 근무 수 계산
		int weekdayShifts = rule.getWdayDCnt() + rule.getWdayECnt() + rule.getWdayNCnt();
		int weekendShifts = rule.getWendDCnt() + rule.getWendECnt() + rule.getWendNCnt();

		// 총 필요 근무 수 계산
		int totalRequiredShifts = (weekdayShifts * yearMonth.weekDaysInMonth())
			+ (weekendShifts * (yearMonth.daysInMonth() - yearMonth.weekDaysInMonth()));

		// 야간 전담 간호사가 없는 경우
		if (nightNurseCnt == 0) {
			int nurseCount = 1;
			while (nurseCount * yearMonth.weekDaysInMonth() < totalRequiredShifts) {
				nurseCount++;
			}
			return nurseCount;
		}

		// 야간 전담 간호사가 있는 경우
		int nightNurseCapacity = nightNurseCnt * (yearMonth.daysInMonth() / 2);
		int remainingShifts = totalRequiredShifts - nightNurseCapacity;
		int normalNurseCount = 1;
		while (normalNurseCount * yearMonth.weekDaysInMonth() < remainingShifts) {
			normalNurseCount++;
		}

		return normalNurseCount + nightNurseCnt;
	}

	// 근무 요청 평가 메서드
	private double evaluateShiftRequests(Solution solution, List<ShiftRequest> requests) {
		if (requests == null || requests.isEmpty()) {
			return 0;
		}

		double violations = 0;
		for (ShiftRequest request : requests) {
			Solution.Nurse nurse = solution.getNurses().stream()
				.filter(n -> n.getId().equals(request.getNurseId()))
				.findFirst()
				.orElse(null);

			if (nurse != null) {
				if (nurse.getShift(request.getDay()) != request.getRequestedShift()) {
					// 강화된 요청에 대해 더 높은 패널티 적용
					violations += request.isReinforced() ? 3.0 : 1.0;  // 예: 강화된 요청은 3배 가중치
				}
			}
		}
		return violations;
	}

	@Getter
	@Builder
	private static class Solution {
		private final int daysInMonth;
		private final List<Nurse> nurses;
		private final Map<Integer, DailyRequirement> dailyRequirements;
		private final double score;

		public Solution copy() {
			return Solution.builder()
				.daysInMonth(daysInMonth)
				.nurses(nurses.stream().map(Nurse::copy).collect(Collectors.toList()))
				.dailyRequirements(new HashMap<>(dailyRequirements))
				.score(score)
				.build();
		}

		@Getter
		@Builder
		static class Nurse {
			private final Long id;
			private final char[] shifts; // D(주간), E(저녁), N(야간), O(휴무), X(고정)
			private final int shiftFlags; // 가능한 근무 유형 플래그 (비트마스크)

			public void setShift(int day, char shift) {
				// 근무 가능 여부 확인 후 설정
				if (canWorkShift(shift) || shift == 'O' || shift == 'X') {
					shifts[day - 1] = shift;
				}
			}

			public char getShift(int day) {
				return shifts[day - 1];
			}

			public Nurse copy() {
				return Nurse.builder()
					.id(id)
					.shifts(Arrays.copyOf(shifts, shifts.length))
					.shiftFlags(shiftFlags)  // shiftFlags 복사 추가
					.build();
			}

			// 특정 근무 유형 가능한지 확인하는 메서드
			public boolean canWorkShift(char shift) {
				switch (shift) {
					case 'D':
						return (shiftFlags & ShiftType.D.getFlag()) != 0;
					case 'E':
						return (shiftFlags & ShiftType.E.getFlag()) != 0;
					case 'N':
						return (shiftFlags & ShiftType.N.getFlag()) != 0;
					case 'M':
						return (shiftFlags & ShiftType.M.getFlag()) != 0;
					case 'O':
						return true; // 휴무는 항상 가능
					case 'X':
						return true; // 고정 근무도 항상 가능
					default:
						return false;
				}
			}

			public boolean hasNodPattern(int startDay) {
				if (startDay + 2 >= shifts.length) {
					return false;
				}

				return shifts[startDay] == 'N'
					&& shifts[startDay + 1] == 'O'
					&& shifts[startDay + 2] == 'D';
			}
		}

		@Getter
		@Builder
		static class DailyRequirement {
			private final int dayNurses;    // 주간 간호사 수
			private final int eveningNurses; // 저녁 간호사 수
			private final int nightNurses;   // 야간 간호사 수
		}
	}

	@Getter
	@Builder
	private static class ShiftRequest {
		private final Long requestId;    // 추가된 필드
		private final Long nurseId;
		private final int day;
		private final char requestedShift;
		private final boolean isReinforced;  // 강화된 요청인지 여부
	}
}
