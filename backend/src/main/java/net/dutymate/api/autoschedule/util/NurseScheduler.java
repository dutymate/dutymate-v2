package net.dutymate.api.autoschedule.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import net.dutymate.api.entity.Request;
import net.dutymate.api.entity.Rule;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.wardschedules.collections.WardSchedule;

import lombok.Builder;
import lombok.Getter;

@Component
public class NurseScheduler {

	private static final double INITIAL_TEMPERATURE = 1000.0;
	private static final double COOLING_RATE = 0.995;
	private static final int MAX_ITERATIONS = 50000;
	private static final int MAX_NO_IMPROVEMENT = 1000;
	private static final Random random = new Random();

	@Getter
	@Builder
	private static class Solution {
		private final int daysInMonth;
		private final List<Nurse> nurses;
		private final Map<Integer, DailyRequirement> dailyRequirements;
		private final double score;

		@Getter
		@Builder
		static class Nurse {
			private final Long id;
			private final char[] shifts; // D(주간), E(저녁), N(야간), O(휴무), X(고정)

			public void setShift(int day, char shift) {
				shifts[day - 1] = shift;
			}

			public char getShift(int day) {
				return shifts[day - 1];
			}

			public Nurse copy() {
				return Nurse.builder()
					.id(id)
					.shifts(Arrays.copyOf(shifts, shifts.length))
					.build();
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

		public Solution copy() {
			return Solution.builder()
				.daysInMonth(daysInMonth)
				.nurses(nurses.stream().map(Nurse::copy).collect(Collectors.toList()))
				.dailyRequirements(new HashMap<>(dailyRequirements))
				.score(score)
				.build();
		}

	}

	public WardSchedule generateSchedule(WardSchedule wardSchedule,
		Rule rule,
		List<WardMember> wardMembers,
		List<WardSchedule.NurseShift> prevNurseShifts,
		YearMonth yearMonth,
		Long currentMemberId,
		List<Request> requests,
		Map<Integer, Integer> dailyNightCnt) {
		Map<Long, String> prevMonthSchedules = getPreviousMonthSchedules(prevNurseShifts);
		Solution currentSolution = createInitialSolution(wardSchedule, rule, wardMembers, yearMonth, dailyNightCnt);
		Solution bestSolution = currentSolution.copy();

		List<ShiftRequest> shiftRequests = requests.stream()
			.map(request -> ShiftRequest.builder()
				.nurseId(request.getWardMember().getMember().getMemberId())
				.day(request.getRequestDate().getDate())
				.requestedShift(request.getRequestShift().getValue().charAt(0))
				.build())
			.toList();
		double currentScore = evaluateSolution(currentSolution, rule, prevMonthSchedules, shiftRequests);
		double bestScore = currentScore;
		double temperature = INITIAL_TEMPERATURE;
		int noImprovementCount = 0;
		for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
			Solution neighborSolution = generateNeighborSolution(currentSolution);
			double neighborScore = evaluateSolution(neighborSolution, rule, prevMonthSchedules, shiftRequests);

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

	private Map<Long, String> getPreviousMonthSchedules(List<WardSchedule.NurseShift> prevNurseShifts) {
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

	private Solution createInitialSolution(WardSchedule wardSchedule,
		Rule rule,
		List<WardMember> wardMembers,
		YearMonth yearMonth,
		Map<Integer, Integer> dailyNightCnt) {
		Map<Long, String> existingSchedules = getExistingSchedules(wardSchedule);
		Map<Integer, Solution.DailyRequirement> requirements = calculateDailyRequirements(rule, yearMonth,
			dailyNightCnt);
		List<Solution.Nurse> nurses = initializeNurses(wardMembers, existingSchedules, yearMonth.daysInMonth());

		for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
			if (hasNoAssignmentsForDay(nurses, day)) {
				assignShiftsForDay(nurses, day, requirements.get(day));
			}
		}

		return Solution.builder()
			.daysInMonth(yearMonth.daysInMonth())
			.nurses(nurses)
			.dailyRequirements(requirements)
			.build();
	}

	private Map<Long, String> getExistingSchedules(WardSchedule wardSchedule) {
		Map<Long, String> existingSchedules = new HashMap<>();
		if (wardSchedule.getDuties() != null && !wardSchedule.getDuties().isEmpty()) {
			WardSchedule.Duty currentDuty = wardSchedule.getDuties().get(wardSchedule.getNowIdx());
			for (WardSchedule.NurseShift shift : currentDuty.getDuty()) {
				existingSchedules.put(shift.getMemberId(), shift.getShifts());
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
		int daysInMonth) {
		return wardMembers.stream()
			.map(wm -> {
				char[] shifts = new char[daysInMonth];
				String existingShifts = existingSchedules.get(wm.getMember().getMemberId());

				if (existingShifts != null) {
					for (int i = 0; i < existingShifts.length(); i++) {
						char shift = existingShifts.charAt(i);
						shifts[i] = shift == 'X' ? 'O' : shift;
					}
				} else {
					Arrays.fill(shifts, 'O');
				}

				return Solution.Nurse.builder()
					.id(wm.getMember().getMemberId())
					.shifts(shifts)
					.build();
			})
			.collect(Collectors.toList());
	}

	private void assignShiftsForDay(List<Solution.Nurse> nurses, int day, Solution.DailyRequirement requirement) {
		List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day);

		// 우선순위 순서대로 근무 배정: 야간 -> 주간 -> 저녁
		assignSpecificShift(availableNurses, day, 'N', requirement.getNightNurses());
		assignSpecificShift(availableNurses, day, 'D', requirement.getDayNurses());
		assignSpecificShift(availableNurses, day, 'E', requirement.getEveningNurses());
	}

	private void assignSpecificShift(List<Solution.Nurse> availableNurses, int day, char shiftType, int required) {
		if (shiftType == 'N') {
			assignNightShifts(availableNurses, day, required);
		} else {
			for (int i = 0; i < required && !availableNurses.isEmpty(); i++) {
				int nurseIdx = random.nextInt(availableNurses.size());
				Solution.Nurse nurse = availableNurses.get(nurseIdx);
				nurse.setShift(day, shiftType);
				availableNurses.remove(nurseIdx);
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
			if (day > 1 && nurse.getShift(day - 1) == 'N') {
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
		if (day + 1 > nurse.getShifts().length) {
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
			if (followingShift != 'O' && followingShift != 'X') {
				return false;
			}
		}

		return true;
	}

	private double evaluateSolution(Solution solution, Rule rule, Map<Long, String> prevMonthSchedules,
		List<ShiftRequest> requests) {
		double score = 0;

		// 강한 제약 조건
		score += evaluateShiftRequirements(solution) * 10000;
		score += evaluateConsecutiveShifts(solution, rule) * 10000;
		score += evaluatePreviousMonthConstraints(solution, prevMonthSchedules, rule) * 10000;

		score += evaluateShiftRequests(solution, requests) * 10000;

		// 약한 제약 조건
		score += evaluateNodPatterns(solution) * 5000;
		score += evaluateShiftPatterns(solution) * 2500;
		score += evaluateWorkloadBalance(solution) * 1000;

		return score;
	}

	private double evaluateNodPatterns(Solution solution) {
		double violations = 0;
		for (Solution.Nurse nurse : solution.getNurses()) {
			for (int day = 1; day <= solution.getDaysInMonth() - 2; day++) {
				if (nurse.hasNodPattern(day - 1)) {
					violations++;
				}
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

				// 기존 야간 근무 관련 체크
				if (lastPrevShift == 'N') {
					// 야간->주간/저녁 패턴 위반 확인
					if (firstCurrentShift == 'D' || firstCurrentShift == 'E') {
						violations += 2;
					}
					// 야간 근무 후 휴식 기간 확인
					if (firstCurrentShift != 'O') {
						violations += 2;
					}
				}

				// 연속 근무일수 체크 추가
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
					violations += (consecutiveShifts - rule.getMaxShift()) * 2;  // 가중치 2 적용
				}

				// 야간 연속 근무 체크 (기존 코드)
				if (lastPrevShift == 'N' && firstCurrentShift == 'N') {
					int consecutiveNights = 1;
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
						violations += consecutiveNights - rule.getMaxN();
					}
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

	private Solution generateNeighborSolution(Solution current) {
		Solution neighbor = current.copy();
		List<Solution.Nurse> nurses = neighbor.getNurses();

		switch (random.nextInt(5)) {  // 야간 근무 패턴 수정을 위한 새로운 케이스 추가
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
		}

		return neighbor;
	}

	private void modifyNightShiftPattern(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		Solution.Nurse nurse = nurses.get(nurseIdx);

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

		char temp = nurses.get(nurse1Idx).getShift(day + 1);
		nurses.get(nurse1Idx).setShift(day + 1, nurses.get(nurse2Idx).getShift(day + 1));
		nurses.get(nurse2Idx).setShift(day + 1, temp);
	}

	private void changeShiftType(List<Solution.Nurse> nurses) {
		if (nurses.isEmpty()) {
			return;
		}

		int nurseIdx = random.nextInt(nurses.size());
		int day = random.nextInt(nurses.get(0).getShifts().length);
		char[] possibleShifts = {'D', 'E', 'N', 'O'};
		char newShift = possibleShifts[random.nextInt(possibleShifts.length)];

		nurses.get(nurseIdx).setShift(day + 1, newShift);
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

		for (int i = 0; i < length && (startDay + i) < nurse1.getShifts().length; i++) {
			char temp = nurse1.getShift(startDay + i + 1);
			nurse1.setShift(startDay + i + 1, nurse2.getShift(startDay + i + 1));
			nurse2.setShift(startDay + i + 1, temp);
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
			char[] alternatives = {'E', 'O'};
			nurse.setShift(startDay + dayToChange + 1,
				alternatives[random.nextInt(alternatives.length)]);
		} else {
			// NOD 패턴 생성 시도
			nurse.setShift(startDay + 1, 'N');
			nurse.setShift(startDay + 2, 'O');
			nurse.setShift(startDay + 3, 'D');
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

	@Getter
	@Builder
	private static class ShiftRequest {
		private final Long nurseId;
		private final int day;
		private final char requestedShift;
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
					violations++;
				}
			}
		}
		return violations;
	}

	public String generateNightSchedule(int daysInMonth, int rotation, int totalNurses,
		Map<Integer, Integer> dailyNightCount) {
		StringBuilder schedule = new StringBuilder();

		// 6일 패턴 (NNNOOO)을 기준으로 rotation 값 적용
		int startDay = rotation * 3 % 6;

		for (int day = 0; day < daysInMonth; day++) {
			int patternDay = (day + startDay) % 6;
			char shift = patternDay < 3 ? 'N' : 'O';
			schedule.append(shift);

			// Map 업데이트
			if (shift == 'N') {
				dailyNightCount.merge(day + 1, 1, Integer::sum);
			}
		}

		return schedule.toString();
	}

	public String headShiftBuilder(YearMonth yearMonth) {

		StringBuilder schedule = new StringBuilder();
		int daysInMonth = yearMonth.daysInMonth();

		for (int day = 1; day <= daysInMonth; day++) {
			schedule.append(yearMonth.isWeekend(day) ? 'O' : 'D');
		}

		return schedule.toString();
	}

}
