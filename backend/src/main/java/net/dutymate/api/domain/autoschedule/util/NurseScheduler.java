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
	private static final int MAX_ITERATIONS = 50000;
	private static final int MAX_NO_IMPROVEMENT = 1000;
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
			wardSchedule, rule, wardMembers, yearMonth, dailyNightCnt,
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
			Solution neighborSolution = generateNeighborSolution(currentSolution, prevMonthSchedules);
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
		WardSchedule wardSchedule,
		Rule rule,
		List<WardMember> wardMembers,
		YearMonth yearMonth,
		Map<Integer, Integer> dailyNightCnt,
		Map<Long, String> prevMonthSchedules,
		Map<Long, WorkIntensity> workIntensities,
		Map<Long, Integer> nurseShiftFlags) {

		Map<Long, String> existingSchedules = getExistingSchedules(wardSchedule);
		Map<Integer, Solution.DailyRequirement> requirements = calculateDailyRequirements(rule, yearMonth,
			dailyNightCnt);

		// 간호사 초기화 (모두 오프로 시작) - 비트마스킹 정보 포함
		List<Solution.Nurse> nurses = initializeNurses(wardMembers, existingSchedules, yearMonth.daysInMonth(),
			nurseShiftFlags);

		// 이전 달 마지막 근무와의 연속성 고려
		considerPreviousMonthContinuity(nurses, prevMonthSchedules, rule);

		// 특정 근무 타입만 가능한 간호사 먼저 처리 (Night 전담, Day 전담 등)
		handleSpecificShiftNurses(nurses, yearMonth, dailyNightCnt);

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

	/**
	 * Night 전담, Day 전담 등 특정 근무 타입만 수행 가능한 간호사들 처리
	 */
	private void handleSpecificShiftNurses(List<Solution.Nurse> nurses, YearMonth yearMonth,
		Map<Integer, Integer> dailyNightCnt) {
		// Night 전담 간호사 처리
		List<Solution.Nurse> nightOnlyNurses = nurses.stream()
			.filter(nurse -> nurse.getShiftFlags() == ShiftType.N.getFlag())
			.collect(Collectors.toList());

		if (!nightOnlyNurses.isEmpty()) {
			// Night 전담 간호사 패턴 생성 (3일 야간, 3일 휴무 패턴 등)
			for (int i = 0; i < nightOnlyNurses.size(); i++) {
				Solution.Nurse nurse = nightOnlyNurses.get(i);

				// 기존 NNNOOO 패턴 적용
				int startDay = i * 3 % 6; // 각 간호사마다 다른 시작점

				for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
					int patternDay = (day - 1 + startDay) % 6;
					char shift = patternDay < 3 ? 'N' : 'O';
					nurse.setShift(day, shift);

					// 야간 근무 카운트 업데이트
					if (shift == 'N') {
						dailyNightCnt.merge(day, 1, Integer::sum);
					}
				}
			}
		}

		// Day 전담 간호사 처리
		nurses.stream()
			.filter(nurse -> nurse.getShiftFlags() == ShiftType.D.getFlag())
			.forEach(nurse -> {
				for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
					// 주말은 휴무, 평일은 D로 설정
					boolean isWeekend = yearMonth.isWeekend(day);
					nurse.setShift(day, isWeekend ? 'O' : 'D');
				}
			});

		// Evening 전담 간호사 처리
		nurses.stream()
			.filter(nurse -> nurse.getShiftFlags() == ShiftType.E.getFlag())
			.forEach(nurse -> {
				for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
					// 주말은 휴무, 평일은 E로 설정
					boolean isWeekend = yearMonth.isWeekend(day);
					nurse.setShift(day, isWeekend ? 'O' : 'E');
				}
			});
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
			if (nurse.canWorkShift('D'))
				possibleShifts.add('D');
			if (nurse.canWorkShift('E'))
				possibleShifts.add('E');
			if (nurse.canWorkShift('N'))
				possibleShifts.add('N');

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
					// 두 가지 가능성 고려:
					// 1. 야간 근무를 계속 이어서 할 경우 (야간 연속성)
					if (random.nextBoolean() && nurse.getShifts().length > 1 && nurse.canWorkShift('N')) {
						// 연속 야간 근무가 rule.getMaxN()을 초과하지 않는지 체크
						int consecutiveNights = 1; // 이전 달 마지막 날 포함
						for (int i = prevSchedule.length() - 2; i >= 0 && i >= prevSchedule.length() - 4; i--) {
							if (prevSchedule.charAt(i) == 'N') {
								consecutiveNights++;
							} else {
								break;
							}
						}

						if (consecutiveNights < rule.getMaxN()) {
							nurse.setShift(1, 'N'); // 첫날도 야간 근무
							if (nurse.getShifts().length > 1) {
								nurse.setShift(2, 'O'); // 둘째날은 휴무
							}
						} else {
							// 이미 최대 연속 야간 근무에 도달한 경우
							nurse.setShift(1, 'O'); // 첫날은 휴무
						}
					} else {
						// 2. 야간 근무 후 휴식이 필요한 경우
						nurse.setShift(1, 'O'); // 첫날은 휴무
					}
				}
			}
		}
	}

	private Map<Long, String> getExistingSchedules(WardSchedule wardSchedule) {
		Map<Long, String> existingSchedules = new HashMap<>();
		if (wardSchedule.getDuties() != null && !wardSchedule.getDuties().isEmpty()) {
			WardSchedule.Duty currentDuty = wardSchedule.getDuties().get(wardSchedule.getNowIdx());
			for (WardSchedule.NurseShift shift : currentDuty.getDuty()) {
				String modifiedShifts = shift.getShifts().replace('M', 'O');
				existingSchedules.put(shift.getMemberId(), modifiedShifts);
			}
		}
		return existingSchedules;
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
		Map<Long, String> existingSchedules,
		int daysInMonth,
		Map<Long, Integer> nurseShiftFlags) {
		return wardMembers.stream()
			.map(wm -> {
				Long memberId = wm.getMember().getMemberId();
				char[] shifts = new char[daysInMonth];
				String existingShifts = existingSchedules.get(memberId);

				if (existingShifts != null) {
					for (int i = 0; i < Math.min(existingShifts.length(), daysInMonth); i++) {
						char shift = existingShifts.charAt(i);
						shifts[i] = shift == 'X' ? 'O' : shift;
					}
				} else {
					Arrays.fill(shifts, 'O');
				}

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
		score += evaluateShiftRequirements(solution) * 10000;
		score += evaluateConsecutiveShifts(solution, rule) * 10000;
		score += evaluatePreviousMonthConstraints(solution, prevMonthSchedules, rule) * 10000;
		score += evaluateShiftTypeConstraints(solution) * 30000; // 근무 유형 제약 (높은 가중치)

		score += evaluateShiftRequests(solution, requests) * 5000;

		// 약한 제약 조건
		score += evaluateNodPatterns(solution, prevMonthSchedules) * 5000;
		score += evaluateShiftPatterns(solution) * 2500;
		score += evaluateWorkloadBalance(solution) * 1000;

		score += evaluateWorkIntensityBalance(solution, workIntensities) * 2000;

		return score;
	}

	// 근무 유형 제약 조건 평가 메서드 (새로 추가

	// 근무 유형 제약 조건 평가 메서드 (새로 추가)
	private double evaluateShiftTypeConstraints(Solution solution) {
		double violations = 0;

		for (Solution.Nurse nurse : solution.getNurses()) {
			// 특정 근무 타입만 가능한 간호사 처리
			boolean isSpecificShiftNurse = nurse.getShiftFlags() == ShiftType.D.getFlag() ||
				nurse.getShiftFlags() == ShiftType.E.getFlag() ||
				nurse.getShiftFlags() == ShiftType.N.getFlag() ||
				nurse.getShiftFlags() == ShiftType.M.getFlag();

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
						violations += 50;  // 높은 패널티
					}

					// 야간 연속성 체크 (이전 달 마지막 N과 첫날 N이 연속일 경우 최대 연속 야간 확인)
					if (firstCurrentShift == 'N') {
						int consecutiveNights = 1; // 마지막 날
						for (int i = prevSchedule.length() - 2; i >= 0; i--) {
							if (prevSchedule.charAt(i) == 'N') {
								consecutiveNights++;
							} else {
								break;
							}
						}

						// 현재 달 연속 야간 체크
						for (int day = 2; day <= solution.getDaysInMonth(); day++) {
							if (nurse.getShift(day) == 'N') {
								consecutiveNights++;
							} else {
								break;
							}
						}

						// 최대 연속 야간 초과 시 패널티
						if (consecutiveNights > rule.getMaxN()) {
							violations += (consecutiveNights - rule.getMaxN()) * 10;
						}
					}

					// 야간 근무 후 바로 휴무가 아닌 경우 (N -> O 아닌 경우) 패널티
					// 단, 야간 연속성 (N -> N)은 예외
					if (firstCurrentShift != 'O' && firstCurrentShift != 'N') {
						violations += 30;
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
			boolean hasSingleNight = false;

			for (int day = 1; day <= solution.getDaysInMonth(); day++) {
				char shift = nurse.getShift(day);
				if (shift != 'O' && shift != 'X') {
					consecutiveShifts++;
					if (shift == 'N') {
						consecutiveNights++;
					} else {
						// 단일 야간 근무에 높은 패널티 부여
						if (consecutiveNights == 1) {
							violations += 10; // 단일 야간 근무에 대한 패널티 증가
							hasSingleNight = true;
						}
						consecutiveNights = 0;
					}
				} else {
					// 휴식일 발생시 단일 야간 패턴 확인
					if (consecutiveNights == 1) {
						violations += 10;
						hasSingleNight = true;
					}
					consecutiveShifts = 0;
					consecutiveNights = 0;
				}

				if (consecutiveShifts > rule.getMaxShift()) {
					violations++;
				}
				if (consecutiveNights > rule.getMaxN()) {
					violations++;
				}
			}

			// 월말 최종 확인
			if (consecutiveNights == 1) {
				violations += 10;
				hasSingleNight = true;
			}

			// 스케줄에 단일 야간이 있는 경우 추가 패널티
			if (hasSingleNight) {
				violations += 5;
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

	private Solution generateNeighborSolution(Solution current, Map<Long, String> prevMonthSchedules) {
		Solution neighbor = current.copy();
		List<Solution.Nurse> nurses = neighbor.getNurses();

		// 기존 케이스에 월말-월초 패턴 처리 케이스 추가
		switch (random.nextInt(6)) {  // 케이스 하나 추가
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
				fixMonthTransitionPatterns(nurses, prevMonthSchedules);
				break;
		}

		return neighbor;
	}

	private void fixMonthTransitionPatterns(List<Solution.Nurse> nurses, Map<Long, String> prevMonthSchedules) {
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
			Solution.Nurse nurse = nightEndNurses.get(random.nextInt(nightEndNurses.size()));

			// 첫날, 둘째날 스케줄 개선
			if (nurse.canWorkShift('N')) {
				// 야간 근무 가능한 경우
				char[] possibleFirstDay = {'N', 'O'};  // 야간 연속 또는 휴무
				char firstShift = possibleFirstDay[random.nextInt(possibleFirstDay.length)];
				nurse.setShift(1, firstShift);

				if (firstShift == 'N' && nurse.getShifts().length > 1) {
					nurse.setShift(2, random.nextBoolean() ? 'N' : 'O');
				} else if (firstShift == 'O' && nurse.getShifts().length > 1) {
					// NOD 패턴 방지
					List<Character> possibleShifts = new ArrayList<>();
					if (nurse.canWorkShift('E'))
						possibleShifts.add('E');
					if (nurse.canWorkShift('N'))
						possibleShifts.add('N');
					possibleShifts.add('O');

					if (!possibleShifts.isEmpty()) {
						nurse.setShift(2, possibleShifts.get(random.nextInt(possibleShifts.size())));
					}
				}
			} else {
				// 야간 근무 불가능한 경우 무조건 휴무
				nurse.setShift(1, 'O');
				if (nurse.getShifts().length > 1) {
					// 둘째날은 가능한 근무 중 하나로
					List<Character> possibleShifts = new ArrayList<>();
					if (nurse.canWorkShift('D'))
						possibleShifts.add('D');
					if (nurse.canWorkShift('E'))
						possibleShifts.add('E');
					possibleShifts.add('O');

					if (!possibleShifts.isEmpty()) {
						nurse.setShift(2, possibleShifts.get(random.nextInt(possibleShifts.size())));
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
			.collect(Collectors.toList());

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
		if (nurse.canWorkShift('D'))
			possibleShifts.add('D');
		if (nurse.canWorkShift('E'))
			possibleShifts.add('E');
		if (nurse.canWorkShift('N'))
			possibleShifts.add('N');
		possibleShifts.add('O'); // 휴무는 항상 가능

		if (possibleShifts.isEmpty()) {
			return; // 가능한 근무 유형이 없으면 변경하지 않음
		}

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
				if (nurse.canWorkShift('E'))
					alternatives.add('E');
				if (nurse.canWorkShift('D'))
					alternatives.add('D');
			} else if (dayToChange == 1) { // O 변경
				if (nurse.canWorkShift('E'))
					alternatives.add('E');
				if (nurse.canWorkShift('N'))
					alternatives.add('N');
				if (nurse.canWorkShift('D'))
					alternatives.add('D');
			} else { // D 변경
				if (nurse.canWorkShift('E'))
					alternatives.add('E');
				if (nurse.canWorkShift('N'))
					alternatives.add('N');
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