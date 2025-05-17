// package net.dutymate.api.domain.autoschedule.util;
//
// import java.util.ArrayList;
// import java.util.Arrays;
// import java.util.Collections;
// import java.util.Comparator;
// import java.util.HashMap;
// import java.util.Iterator;
// import java.util.List;
// import java.util.Map;
// import java.util.Random;
// import java.util.stream.Collectors;
//
// import org.springframework.stereotype.Component;
//
// import net.dutymate.api.domain.common.utils.YearMonth;
// import net.dutymate.api.domain.request.Request;
// import net.dutymate.api.domain.rule.Rule;
// import net.dutymate.api.domain.wardmember.ShiftType;
// import net.dutymate.api.domain.wardmember.WardMember;
// import net.dutymate.api.domain.wardmember.WorkIntensity;
// import net.dutymate.api.domain.wardschedules.collections.WardSchedule;
//
// import lombok.Builder;
// import lombok.Getter;
// import lombok.Setter;
//
// @Component
// public class GeneticNurseScheduler {
//
// 	// 유전 알고리즘 설정
// 	private static final int POPULATION_SIZE = 100;     // 500에서 100으로 감소
// 	private static final int MAX_GENERATIONS = 10000;   // 5000에서 10000으로 증가
// 	private static final double CROSSOVER_RATE = 0.85;  // 0.8에서 0.85로 약간 증가
// 	private static final double MUTATION_RATE = 0.15;   // 0.2에서 0.15로 약간 감소
// 	private static final double ELITE_RATE = 0.05;      // 0.1에서 0.05로 감소
// 	private static final int TOURNAMENT_SIZE = 3;       // 5에서 3으로 감소
// 	private static final int NO_IMPROVEMENT_LIMIT = 100; // 50에서 100으로 증가
// 	private static final Random random = new Random();
//
// 	public WardSchedule generateSchedule(WardSchedule wardSchedule,
// 		Rule rule,
// 		List<WardMember> wardMembers,
// 		List<WardSchedule.NurseShift> prevNurseShifts,
// 		YearMonth yearMonth,
// 		Long currentMemberId,
// 		List<Request> requests,
// 		Map<Integer, Integer> dailyNightCnt,
// 		List<Long> reinforcementRequestIds,
// 		Map<Long, WorkIntensity> workIntensities,
// 		Map<Long, Integer> nurseShiftFlags) {
//
// 		// 이전 달 스케줄 정보 가져오기
// 		Map<Long, String> prevMonthSchedules = getPreviousMonthSchedules(prevNurseShifts);
//
// 		// 요청 정보 변환
// 		List<Long> safeReinforcementIds = reinforcementRequestIds != null
// 			? reinforcementRequestIds : Collections.emptyList();
//
// 		List<ShiftRequest> shiftRequests = requests.stream()
// 			.map(request -> ShiftRequest.builder()
// 				.requestId(request.getRequestId())
// 				.nurseId(request.getWardMember().getMember().getMemberId())
// 				.day(request.getRequestDate().getDate())
// 				.requestedShift(request.getRequestShift().getValue().charAt(0))
// 				.isReinforced(safeReinforcementIds.contains(request.getRequestId()))
// 				.build())
// 			.toList();
//
// 		// 1. 초기 집단 생성
// 		List<Solution> population = initializePopulation(
// 			POPULATION_SIZE, rule, wardMembers, yearMonth,
// 			dailyNightCnt, prevMonthSchedules, workIntensities, nurseShiftFlags
// 		);
//
// 		// 2. 진화 과정 시작
// 		Solution bestSolution = evolvePopulation(
// 			population, rule, prevMonthSchedules, shiftRequests,
// 			workIntensities, yearMonth, nurseShiftFlags
// 		);
//
// 		// 3. 최종 결과를 wardSchedule에 적용
// 		return applyFinalSchedule(wardSchedule, bestSolution, currentMemberId);
// 	}
//
// 	/**
// 	 * 초기 집단을 생성합니다.
// 	 */
// 	private List<Solution> initializePopulation(
// 		int populationSize,
// 		Rule rule,
// 		List<WardMember> wardMembers,
// 		YearMonth yearMonth,
// 		Map<Integer, Integer> dailyNightCnt,
// 		Map<Long, String> prevMonthSchedules,
// 		Map<Long, WorkIntensity> workIntensities,
// 		Map<Long, Integer> nurseShiftFlags) {
//
// 		List<Solution> population = new ArrayList<>();
//
// 		for (int i = 0; i < populationSize; i++) {
// 			// 각 개체마다 약간 다른 초기화 적용 (다양성 확보)
// 			Solution solution = createInitialSolution(
// 				rule, wardMembers, yearMonth, dailyNightCnt,
// 				prevMonthSchedules, workIntensities, nurseShiftFlags,
// 				i % 5 // 다양한 초기화 전략 적용 (0~4)
// 			);
// 			population.add(solution);
// 		}
//
// 		return population;
// 	}
//
// 	/**
// 	 * 초기 해결책을 만듭니다. 전략 파라미터에 따라 다른 방식으로 초기화합니다.
// 	 */
// 	private Solution createInitialSolution(
// 		Rule rule,
// 		List<WardMember> wardMembers,
// 		YearMonth yearMonth,
// 		Map<Integer, Integer> dailyNightCnt,
// 		Map<Long, String> prevMonthSchedules,
// 		Map<Long, WorkIntensity> workIntensities,
// 		Map<Long, Integer> nurseShiftFlags,
// 		int strategy) {
//
// 		// 일별 필요 간호사 수 계산
// 		Map<Integer, Solution.DailyRequirement> requirements = calculateDailyRequirements(
// 			rule, yearMonth, dailyNightCnt
// 		);
//
// 		// 간호사 초기화 (모두 오프로 시작)
// 		List<Solution.Nurse> nurses = initializeNurses(
// 			wardMembers, yearMonth.daysInMonth(), nurseShiftFlags
// 		);
//
// 		// 전달 연속성 고려
// 		considerPreviousMonthContinuity(nurses, prevMonthSchedules, rule);
//
// 		// 초기화 전략에 따라 다르게 초기화
// 		switch (strategy) {
// 			case 0: // 기본 전략 - 일별로 필요 인원 채우기
// 				fillRequirementsByDay(nurses, yearMonth.daysInMonth(), requirements, workIntensities);
// 				break;
// 			case 1: // 간호사별 전략 - 각 간호사마다 전체 일정 할당 후 조정
// 				fillRequirementsByNurse(nurses, yearMonth.daysInMonth(), requirements, workIntensities);
// 				break;
// 			case 2: // 근무 유형별 전략 - 야간, 주간, 저녁 순서로 배정
// 				fillRequirementsByShiftType(nurses, yearMonth.daysInMonth(), requirements, workIntensities);
// 				break;
// 			case 3: // 워크 인텐시티 전략 - 워크 인텐시티에 따라 먼저 배정
// 				fillRequirementsByWorkIntensity(nurses, yearMonth.daysInMonth(), requirements, workIntensities);
// 				break;
// 			case 4: // 랜덤 배정 전략 - 완전 랜덤하게 배정 후 요구사항 충족 조정
// 				fillRequirementsRandomly(nurses, yearMonth.daysInMonth(), requirements);
// 				break;
// 		}
//
// 		// 요구사항 미충족 부분 최종 조정
// 		adjustScheduleToMeetRequirements(nurses, yearMonth.daysInMonth(), requirements);
//
// 		return Solution.builder()
// 			.daysInMonth(yearMonth.daysInMonth())
// 			.nurses(nurses)
// 			.dailyRequirements(requirements)
// 			.build();
// 	}
//
// 	// 일별로 필요 인원 채우는 전략
// 	private void fillRequirementsByDay(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			Solution.DailyRequirement req = requirements.get(day);
// 			List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day);
//
// 			// 워크 인텐시티에 따라 정렬 (HIGH 우선)
// 			sortNursesByWorkIntensity(availableNurses, workIntensities);
//
// 			// 필요 인원 채우기
// 			assignShiftsForDay(availableNurses, day, req);
// 		}
// 	}
//
// 	// 간호사별로 전체 일정 채우는 전략
// 	private void fillRequirementsByNurse(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		// 워크 인텐시티에 따라 간호사 정렬
// 		sortNursesByWorkIntensity(nurses, workIntensities);
//
// 		// 각 간호사마다 근무 배정
// 		for (Solution.Nurse nurse : nurses) {
// 			assignShiftsForNurse(nurse, daysInMonth, requirements, workIntensities);
// 		}
// 	}
//
// 	// 근무 유형별로 채우는 전략 (야간 → 주간 → 저녁 순)
// 	private void fillRequirementsByShiftType(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		// 1. 먼저 야간 근무 배정
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			int nightNurses = requirements.get(day).getNightNurses();
// 			List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day)
// 				.stream()
// 				.filter(nurse -> nurse.canWorkShift('N'))
// 				.collect(Collectors.toList());
//
// 			sortNursesByWorkIntensity(availableNurses, workIntensities);
// 			assignSpecificShift(availableNurses, day, 'N', nightNurses);
// 		}
//
// 		// 2. 주간 근무 배정
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			int dayNurses = requirements.get(day).getDayNurses();
// 			List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day)
// 				.stream()
// 				.filter(nurse -> nurse.canWorkShift('D'))
// 				.collect(Collectors.toList());
//
// 			sortNursesByWorkIntensity(availableNurses, workIntensities);
// 			assignSpecificShift(availableNurses, day, 'D', dayNurses);
// 		}
//
// 		// 3. 저녁 근무 배정
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			int eveningNurses = requirements.get(day).getEveningNurses();
// 			List<Solution.Nurse> availableNurses = getAvailableNursesForDay(nurses, day)
// 				.stream()
// 				.filter(nurse -> nurse.canWorkShift('E'))
// 				.collect(Collectors.toList());
//
// 			sortNursesByWorkIntensity(availableNurses, workIntensities);
// 			assignSpecificShift(availableNurses, day, 'E', eveningNurses);
// 		}
// 	}
//
// 	// 워크 인텐시티에 따라 채우는 전략
// 	private void fillRequirementsByWorkIntensity(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		// 워크 인텐시티 HIGH → MEDIUM → LOW 순으로 그룹화
// 		Map<WorkIntensity, List<Solution.Nurse>> intensityGroups = new HashMap<>();
// 		for (Solution.Nurse nurse : nurses) {
// 			WorkIntensity intensity = workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM);
// 			intensityGroups.computeIfAbsent(intensity, k -> new ArrayList<>()).add(nurse);
// 		}
//
// 		// 각 인텐시티 그룹별로 처리 (HIGH 우선)
// 		if (intensityGroups.containsKey(WorkIntensity.HIGH)) {
// 			assignNurseGroupByIntensity(
// 				intensityGroups.get(WorkIntensity.HIGH),
// 				daysInMonth,
// 				requirements,
// 				0.7  // 70% 근무율 목표
// 			);
// 		}
//
// 		if (intensityGroups.containsKey(WorkIntensity.MEDIUM)) {
// 			assignNurseGroupByIntensity(
// 				intensityGroups.get(WorkIntensity.MEDIUM),
// 				daysInMonth,
// 				requirements,
// 				0.6  // 60% 근무율 목표
// 			);
// 		}
//
// 		if (intensityGroups.containsKey(WorkIntensity.LOW)) {
// 			assignNurseGroupByIntensity(
// 				intensityGroups.get(WorkIntensity.LOW),
// 				daysInMonth,
// 				requirements,
// 				0.5  // 50% 근무율 목표
// 			);
// 		}
// 	}
//
// 	// 완전 랜덤하게 배정하는 전략
// 	private void fillRequirementsRandomly(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements) {
//
// 		// 각 간호사의 근무 가능한 유형 확인
// 		for (Solution.Nurse nurse : nurses) {
// 			for (int day = 1; day <= daysInMonth; day++) {
// 				// 이미 배정된 근무는 건너뜀
// 				if (nurse.getShift(day) != 'O' && nurse.getShift(day) != 'X') {
// 					continue;
// 				}
//
// 				// 랜덤하게 근무 유형 선택 (70% 확률로 배정, 30%는 휴무)
// 				if (random.nextDouble() < 0.7) {
// 					List<Character> possibleShifts = new ArrayList<>();
// 					if (nurse.canWorkShift('D'))
// 						possibleShifts.add('D');
// 					if (nurse.canWorkShift('E'))
// 						possibleShifts.add('E');
// 					if (nurse.canWorkShift('N'))
// 						possibleShifts.add('N');
//
// 					if (!possibleShifts.isEmpty()) {
// 						char shift = possibleShifts.get(random.nextInt(possibleShifts.size()));
// 						nurse.setShift(day, shift);
// 					}
// 				}
// 				// 나머지는 휴무(O)로 유지
// 			}
// 		}
// 	}
//
// 	// 하나의 간호사에게 전체 일정 할당
// 	private void assignShiftsForNurse(
// 		Solution.Nurse nurse,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		WorkIntensity intensity = workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM);
//
// 		// 목표 근무 일수 (워크 인텐시티에 따라 다름)
// 		double targetWorkRatio;
// 		switch (intensity) {
// 			case HIGH:
// 				targetWorkRatio = 0.7; // 70% 근무
// 				break;
// 			case LOW:
// 				targetWorkRatio = 0.5; // 50% 근무
// 				break;
// 			default: // MEDIUM
// 				targetWorkRatio = 0.6; // 60% 근무
// 		}
//
// 		int targetWorkDays = (int)(daysInMonth * targetWorkRatio);
//
// 		// 현재 근무 일수 계산
// 		int currentWorkDays = 0;
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			char shift = nurse.getShift(day);
// 			if (shift != 'O' && shift != 'X') {
// 				currentWorkDays++;
// 			}
// 		}
//
// 		// 목표 근무 일수까지 랜덤하게 근무 배정
// 		if (currentWorkDays < targetWorkDays) {
// 			List<Integer> availableDays = new ArrayList<>();
// 			for (int day = 1; day <= daysInMonth; day++) {
// 				if (nurse.getShift(day) == 'O') {
// 					availableDays.add(day);
// 				}
// 			}
//
// 			Collections.shuffle(availableDays);
//
// 			int daysToAdd = Math.min(targetWorkDays - currentWorkDays, availableDays.size());
// 			for (int i = 0; i < daysToAdd; i++) {
// 				int day = availableDays.get(i);
//
// 				// 가능한 근무 유형 중 하나 선택
// 				List<Character> possibleShifts = new ArrayList<>();
// 				if (nurse.canWorkShift('D'))
// 					possibleShifts.add('D');
// 				if (nurse.canWorkShift('E'))
// 					possibleShifts.add('E');
// 				if (nurse.canWorkShift('N'))
// 					possibleShifts.add('N');
//
// 				if (!possibleShifts.isEmpty()) {
// 					char shift = possibleShifts.get(random.nextInt(possibleShifts.size()));
// 					nurse.setShift(day, shift);
// 				}
// 			}
// 		}
// 	}
//
// 	// 인텐시티 그룹별 배정
// 	private void assignNurseGroupByIntensity(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements,
// 		double targetWorkRatio) {
//
// 		for (Solution.Nurse nurse : nurses) {
// 			int targetWorkDays = (int)(daysInMonth * targetWorkRatio);
// 			int currentWorkDays = 0;
//
// 			// 현재 근무 일수 계산
// 			for (int day = 1; day <= daysInMonth; day++) {
// 				char shift = nurse.getShift(day);
// 				if (shift != 'O' && shift != 'X') {
// 					currentWorkDays++;
// 				}
// 			}
//
// 			// 목표 일수에 맞게 조정
// 			if (currentWorkDays < targetWorkDays) {
// 				// 추가 근무 배정
// 				assignAdditionalShifts(nurse, daysInMonth, targetWorkDays - currentWorkDays);
// 			} else if (currentWorkDays > targetWorkDays) {
// 				// 초과 근무 감소
// 				reduceExcessShifts(nurse, currentWorkDays - targetWorkDays);
// 			}
// 		}
// 	}
//
// 	// 추가 근무 배정
// 	private void assignAdditionalShifts(Solution.Nurse nurse, int daysInMonth, int shiftsToAdd) {
// 		List<Integer> availableDays = new ArrayList<>();
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			if (nurse.getShift(day) == 'O') {
// 				availableDays.add(day);
// 			}
// 		}
//
// 		Collections.shuffle(availableDays);
//
// 		for (int i = 0; i < Math.min(shiftsToAdd, availableDays.size()); i++) {
// 			int day = availableDays.get(i);
//
// 			// 가능한 근무 유형 중 하나 선택
// 			List<Character> possibleShifts = new ArrayList<>();
// 			if (nurse.canWorkShift('D'))
// 				possibleShifts.add('D');
// 			if (nurse.canWorkShift('E'))
// 				possibleShifts.add('E');
// 			if (nurse.canWorkShift('N'))
// 				possibleShifts.add('N');
//
// 			if (!possibleShifts.isEmpty()) {
// 				// 야간 근무는 연속성 확인
// 				if (possibleShifts.contains('N')) {
// 					// 하루 전이 N이거나, 하루 후에 N 배정 가능하면 N 우선
// 					boolean prevDayIsNight = day > 1 && nurse.getShift(day - 1) == 'N';
// 					boolean canAssignNextDayNight = day < daysInMonth && nurse.getShift(day + 1) == 'O';
//
// 					if (prevDayIsNight || (canAssignNextDayNight && random.nextBoolean())) {
// 						nurse.setShift(day, 'N');
// 						// 다음날도 연속 야간 배정 고려
// 						if (canAssignNextDayNight && !prevDayIsNight && shiftsToAdd > 1) {
// 							nurse.setShift(day + 1, 'N');
// 							i++; // 추가 배정했으므로 카운트 증가
// 						}
// 						continue;
// 					}
// 				}
//
// 				// 일반적인 경우 랜덤 선택
// 				char shift = possibleShifts.get(random.nextInt(possibleShifts.size()));
// 				nurse.setShift(day, shift);
// 			}
// 		}
// 	}
//
// 	// 초과 근무 감소
// 	private void reduceExcessShifts(Solution.Nurse nurse, int shiftsToReduce) {
// 		List<Integer> workDays = new ArrayList<>();
// 		for (int day = 1; day <= nurse.getShifts().length; day++) {
// 			char shift = nurse.getShift(day);
// 			if (shift != 'O' && shift != 'X') {
// 				workDays.add(day);
// 			}
// 		}
//
// 		Collections.shuffle(workDays);
//
// 		for (int i = 0; i < Math.min(shiftsToReduce, workDays.size()); i++) {
// 			int day = workDays.get(i);
// 			nurse.setShift(day, 'O');
// 		}
// 	}
//
// 	// 요구사항 충족되도록 최종 조정
// 	private void adjustScheduleToMeetRequirements(
// 		List<Solution.Nurse> nurses,
// 		int daysInMonth,
// 		Map<Integer, Solution.DailyRequirement> requirements) {
//
// 		for (int day = 1; day <= daysInMonth; day++) {
// 			Solution.DailyRequirement req = requirements.get(day);
// 			Map<Character, Integer> currentAssignments = countShiftsForDay(nurses, day);
//
// 			// 주간 근무 조정
// 			adjustShiftCount(nurses, day, 'D', req.getDayNurses(), currentAssignments.getOrDefault('D', 0));
//
// 			// 저녁 근무 조정
// 			adjustShiftCount(nurses, day, 'E', req.getEveningNurses(), currentAssignments.getOrDefault('E', 0));
//
// 			// 야간 근무 조정
// 			adjustShiftCount(nurses, day, 'N', req.getNightNurses(), currentAssignments.getOrDefault('N', 0));
// 		}
// 	}
//
// 	// 특정 근무 유형 개수 조정
// 	private void adjustShiftCount(
// 		List<Solution.Nurse> nurses,
// 		int day,
// 		char shiftType,
// 		int required,
// 		int current) {
//
// 		if (current == required) {
// 			return; // 이미 요구사항 충족
// 		}
//
// 		if (current < required) {
// 			// 추가 필요
// 			int needed = required - current;
// 			List<Solution.Nurse> availableNurses = nurses.stream()
// 				.filter(n -> n.getShift(day) == 'O' && n.canWorkShift(shiftType))
// 				.collect(Collectors.toList());
//
// 			for (int i = 0; i < Math.min(needed, availableNurses.size()); i++) {
// 				availableNurses.get(i).setShift(day, shiftType);
// 			}
// 		} else {
// 			// 감소 필요
// 			int excess = current - required;
// 			List<Solution.Nurse> assignedNurses = nurses.stream()
// 				.filter(n -> n.getShift(day) == shiftType)
// 				.collect(Collectors.toList());
//
// 			Collections.shuffle(assignedNurses);
//
// 			for (int i = 0; i < Math.min(excess, assignedNurses.size()); i++) {
// 				assignedNurses.get(i).setShift(day, 'O');
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 집단을 진화시키는 메인 메서드
// 	 */
// 	private Solution evolvePopulation(
// 		List<Solution> population,
// 		Rule rule,
// 		Map<Long, String> prevMonthSchedules,
// 		List<ShiftRequest> shiftRequests,
// 		Map<Long, WorkIntensity> workIntensities,
// 		YearMonth yearMonth,
// 		Map<Long, Integer> nurseShiftFlags) {
//
// 		// 첫 세대 평가
// 		evaluatePopulation(population, rule, prevMonthSchedules, shiftRequests, workIntensities);
//
// 		// 최선의 해결책 초기화
// 		Solution bestSolution = findBestSolution(population);
// 		double bestFitness = bestSolution.getScore();
//
// 		int noImprovementCount = 0;
//
// 		// 세대 반복
// 		for (int generation = 0; generation < MAX_GENERATIONS; generation++) {
// 			// 새로운 세대 생성
// 			List<Solution> newPopulation = new ArrayList<>();
//
// 			// 엘리트 전략: 상위 일부는 그대로 다음 세대로 (변형 없이)
// 			int eliteCount = (int)(POPULATION_SIZE * ELITE_RATE);
// 			for (int i = 0; i < eliteCount; i++) {
// 				newPopulation.add(population.get(i).copy());
// 			}
//
// 			// 교차와 돌연변이로 나머지 개체 생성
// 			while (newPopulation.size() < POPULATION_SIZE) {
// 				// 토너먼트 선택으로 부모 선택
// 				Solution parent1 = tournamentSelection(population);
// 				Solution parent2 = tournamentSelection(population);
//
// 				// 교차 연산
// 				Solution child;
// 				if (random.nextDouble() < CROSSOVER_RATE) {
// 					child = crossover(parent1, parent2);
// 				} else {
// 					// 교차하지 않으면 부모 중 하나 선택
// 					child = random.nextBoolean() ? parent1.copy() : parent2.copy();
// 				}
//
// 				// 돌연변이 연산
// 				if (random.nextDouble() < MUTATION_RATE) {
// 					mutate(child, rule, prevMonthSchedules);
// 				}
//
// 				// 유효성 검사 및 수리
// 				repairSolution(child, rule, prevMonthSchedules, yearMonth, nurseShiftFlags);
//
// 				newPopulation.add(child);
// 			}
//
// 			// 새 세대로 교체
// 			population = newPopulation;
//
// 			// 새 세대 평가
// 			evaluatePopulation(population, rule, prevMonthSchedules, shiftRequests, workIntensities);
//
// 			// 최선의 해결책 갱신
// 			Solution currentBest = findBestSolution(population);
// 			if (currentBest.getScore() < bestFitness) {
// 				bestSolution = currentBest.copy();
// 				bestFitness = currentBest.getScore();
// 				noImprovementCount = 0;
//
// 				// 로그 출력
// 				System.out.println("세대 " + generation + ": 개선된 최선의 점수 = " + bestFitness);
// 			} else {
// 				noImprovementCount++;
//
// 				if (generation % 10 == 0) {
// 					System.out.println("세대 " + generation + ": 현재 최선의 점수 = " + bestFitness);
// 				}
// 			}
//
// 			// 개선이 오랫동안 없으면 조기 종료
// 			if (noImprovementCount >= NO_IMPROVEMENT_LIMIT) {
// 				System.out.println("개선 없이 " + NO_IMPROVEMENT_LIMIT + "세대 지남. 진화 종료.");
// 				break;
// 			}
// 		}
//
// 		return bestSolution;
// 	}
//
// 	/**
// 	 * 집단의 모든 해결책 평가
// 	 */
// 	/**
// 	 * 집단의 모든 해결책 평가
// 	 */
// 	private void evaluatePopulation(
// 		List<Solution> population,
// 		Rule rule,
// 		Map<Long, String> prevMonthSchedules,
// 		List<ShiftRequest> shiftRequests,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		// 각 해결책 평가
// 		for (Solution solution : population) {
// 			double score = evaluateSolution(solution, rule, prevMonthSchedules, shiftRequests, workIntensities);
//
// 			// 스코어 갱신 (낮을수록 좋음)
// 			solution.setScore(score);
// 		}
//
// 		// 평가 결과에 따라 정렬 (점수가 낮은 것이 더 좋음)
// 		Collections.sort(population, Comparator.comparingDouble(Solution::getScore));
// 	}
//
// 	/**
// 	 * 해결책 평가 - 기존 코드와 동일하게 유지
// 	 */
// 	private double evaluateSolution(Solution solution,
// 		Rule rule,
// 		Map<Long, String> prevMonthSchedules,
// 		List<ShiftRequest> requests,
// 		Map<Long, WorkIntensity> workIntensities) {
//
// 		double score = 0;
//
// 		// 강한 제약 조건
// 		score += evaluateShiftRequirements(solution) * 10000;
// 		score += evaluateConsecutiveShifts(solution, rule) * 15000;
// 		score += evaluatePreviousMonthConstraints(solution, prevMonthSchedules, rule) * 10000;
// 		score += evaluateShiftTypeConstraints(solution) * 10000;
//
// 		score += evaluateShiftRequests(solution, requests) * 5000;
//
// 		// 약한 제약 조건
// 		score += evaluateNodPatterns(solution, prevMonthSchedules) * 3000;
// 		score += evaluateShiftPatterns(solution) * 5000;
// 		score += evaluateWorkloadBalance(solution) * 1000;
// 		score += evaluateWorkIntensityBalance(solution, workIntensities) * 2000;
// 		score += evaluateAlternatingWorkPattern(solution) * 500;
// 		score += evaluateShiftConsistency(solution) * 3000;
//
// 		return score;
// 	}
//
// 	/**
// 	 * 토너먼트 선택 - 무작위로 선택된 일부 해결책 중에서 최선의 것 선택
// 	 */
// 	private Solution tournamentSelection(List<Solution> population) {
// 		List<Solution> tournament = new ArrayList<>();
//
// 		// 토너먼트 크기만큼 무작위 선택
// 		for (int i = 0; i < TOURNAMENT_SIZE; i++) {
// 			int randomIndex = random.nextInt(population.size());
// 			tournament.add(population.get(randomIndex));
// 		}
//
// 		// 가장 좋은 해결책 선택 (점수가 낮을수록 좋음)
// 		return tournament.stream()
// 			.min(Comparator.comparingDouble(Solution::getScore))
// 			.orElse(population.get(0));
// 	}
//
// 	/**
// 	 * 교차 연산 - 두 부모의 특성을 조합하여 새로운 자식 생성
// 	 */
// 	private Solution crossover(Solution parent1, Solution parent2) {
// 		Solution child = parent1.copy();
// 		List<Solution.Nurse> childNurses = child.getNurses();
//
// 		// 교차 전략 선택
// 		int strategy = random.nextInt(3);
//
// 		switch (strategy) {
// 			case 0: // 균등 교차 (Uniform Crossover)
// 				uniformCrossover(childNurses, parent2.getNurses());
// 				break;
//
// 			case 1: // 일별 교차 (Day-wise Crossover)
// 				dayCrossover(childNurses, parent2.getNurses(), child.getDaysInMonth());
// 				break;
//
// 			case 2: // 간호사별 교차 (Nurse-wise Crossover)
// 				nurseCrossover(childNurses, parent2.getNurses());
// 				break;
// 		}
//
// 		return child;
// 	}
//
// 	/**
// 	 * 균등 교차 - 각 간호사의 각 날짜마다 임의로 부모 선택
// 	 */
// 	private void uniformCrossover(List<Solution.Nurse> childNurses, List<Solution.Nurse> parent2Nurses) {
// 		for (int i = 0; i < childNurses.size(); i++) {
// 			Solution.Nurse childNurse = childNurses.get(i);
// 			Solution.Nurse parent2Nurse = parent2Nurses.get(i);
//
// 			for (int day = 1; day <= childNurse.getShifts().length; day++) {
// 				// 50% 확률로 부모2의 유전자 상속
// 				if (random.nextBoolean()) {
// 					char shift = parent2Nurse.getShift(day);
// 					// 간호사가 해당 근무 가능한 경우만 교체
// 					if (childNurse.canWorkShift(shift) || shift == 'O' || shift == 'X') {
// 						childNurse.setShift(day, shift);
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 일별 교차 - 날짜를 기준으로 잘라서 교차
// 	 */
// 	private void dayCrossover(List<Solution.Nurse> childNurses, List<Solution.Nurse> parent2Nurses, int daysInMonth) {
// 		// 교차점 선택 (어느 날짜에서 자를지)
// 		int crossoverPoint = random.nextInt(daysInMonth - 1) + 1;
//
// 		for (int i = 0; i < childNurses.size(); i++) {
// 			Solution.Nurse childNurse = childNurses.get(i);
// 			Solution.Nurse parent2Nurse = parent2Nurses.get(i);
//
// 			// 교차점 이후 일정은 부모2에서 가져옴
// 			for (int day = crossoverPoint + 1; day <= daysInMonth; day++) {
// 				char shift = parent2Nurse.getShift(day);
// 				if (childNurse.canWorkShift(shift) || shift == 'O' || shift == 'X') {
// 					childNurse.setShift(day, shift);
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 간호사별 교차 - 간호사를 기준으로 잘라서 교차
// 	 */
// 	private void nurseCrossover(List<Solution.Nurse> childNurses, List<Solution.Nurse> parent2Nurses) {
// 		// 교차점 선택 (어느 간호사에서 자를지)
// 		int crossoverPoint = random.nextInt(childNurses.size() - 1);
//
// 		// 교차점 이후 간호사는 부모2에서 가져옴
// 		for (int i = crossoverPoint + 1; i < childNurses.size(); i++) {
// 			Solution.Nurse childNurse = childNurses.get(i);
// 			Solution.Nurse parent2Nurse = parent2Nurses.get(i);
//
// 			for (int day = 1; day <= childNurse.getShifts().length; day++) {
// 				char shift = parent2Nurse.getShift(day);
// 				if (childNurse.canWorkShift(shift) || shift == 'O' || shift == 'X') {
// 					childNurse.setShift(day, shift);
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 돌연변이 연산 - 해결책의 일부를 임의로 변경
// 	 */
// 	private void mutate(Solution solution, Rule rule, Map<Long, String> prevMonthSchedules) {
// 		List<Solution.Nurse> nurses = solution.getNurses();
//
// 		// 돌연변이 전략 선택
// 		int strategy = random.nextInt(7);
//
// 		switch (strategy) {
// 			case 0: // 단일 근무 변경
// 				singleShiftMutation(nurses);
// 				break;
//
// 			case 1: // 간호사 간 근무 교환
// 				swapNurseShiftsMutation(nurses);
// 				break;
//
// 			case 2: // 연속 근무 유형 변경
// 				consistentShiftsMutation(nurses);
// 				break;
//
// 			case 3: // 야간 근무 패턴 개선
// 				nightShiftPatternMutation(nurses);
// 				break;
//
// 			case 4: // NOD 패턴 수정
// 				nodPatternMutation(nurses);
// 				break;
//
// 			case 5: // 월말-월초 패턴 처리
// 				monthTransitionMutation(nurses, prevMonthSchedules, rule);
// 				break;
//
// 			case 6: // 근무-휴무 패턴 수정
// 				workOffPatternMutation(nurses);
// 				break;
// 		}
// 	}
//
// 	/**
// 	 * 단일 근무 변경 돌연변이
// 	 */
// 	private void singleShiftMutation(List<Solution.Nurse> nurses) {
// 		if (nurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nurses.size());
// 		Solution.Nurse nurse = nurses.get(nurseIdx);
//
// 		// 무작위 날짜 선택
// 		int day = random.nextInt(nurse.getShifts().length) + 1;
//
// 		// 가능한 근무 유형 목록 생성
// 		List<Character> possibleShifts = new ArrayList<>();
// 		if (nurse.canWorkShift('D'))
// 			possibleShifts.add('D');
// 		if (nurse.canWorkShift('E'))
// 			possibleShifts.add('E');
// 		if (nurse.canWorkShift('N'))
// 			possibleShifts.add('N');
// 		possibleShifts.add('O'); // 휴무는 항상 가능
//
// 		// 현재와 다른 근무 유형 선택
// 		char currentShift = nurse.getShift(day);
// 		possibleShifts.remove(Character.valueOf(currentShift));
//
// 		if (!possibleShifts.isEmpty()) {
// 			char newShift = possibleShifts.get(random.nextInt(possibleShifts.size()));
// 			nurse.setShift(day, newShift);
// 		}
// 	}
//
// 	/**
// 	 * 간호사 간 근무 교환 돌연변이
// 	 */
// 	private void swapNurseShiftsMutation(List<Solution.Nurse> nurses) {
// 		if (nurses.size() < 2)
// 			return;
//
// 		// 두 간호사 선택
// 		int nurse1Idx = random.nextInt(nurses.size());
// 		int nurse2Idx = random.nextInt(nurses.size() - 1);
// 		if (nurse2Idx >= nurse1Idx)
// 			nurse2Idx++;
//
// 		Solution.Nurse nurse1 = nurses.get(nurse1Idx);
// 		Solution.Nurse nurse2 = nurses.get(nurse2Idx);
//
// 		// 무작위 날짜 선택
// 		int day = random.nextInt(nurse1.getShifts().length) + 1;
//
// 		// 두 간호사의 근무 교환
// 		char shift1 = nurse1.getShift(day);
// 		char shift2 = nurse2.getShift(day);
//
// 		// 서로 교환 가능한 경우만 교환
// 		if ((nurse2.canWorkShift(shift1) || shift1 == 'O' || shift1 == 'X') &&
// 			(nurse1.canWorkShift(shift2) || shift2 == 'O' || shift2 == 'X')) {
// 			nurse1.setShift(day, shift2);
// 			nurse2.setShift(day, shift1);
// 		}
// 	}
//
// 	/**
// 	 * 연속 근무 유형 일관성 개선 돌연변이
// 	 */
// 	private void consistentShiftsMutation(List<Solution.Nurse> nurses) {
// 		if (nurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nurses.size());
// 		Solution.Nurse nurse = nurses.get(nurseIdx);
//
// 		// 근무 시퀀스 찾기
// 		List<Integer> workSequences = findWorkSequences(nurse);
//
// 		if (!workSequences.isEmpty()) {
// 			// 무작위 시퀀스 선택
// 			int seqIdx = random.nextInt(workSequences.size());
// 			int startDay = workSequences.get(seqIdx);
//
// 			// 시퀀스 길이 및 종료일 계산
// 			int endDay = startDay;
// 			while (endDay < nurse.getShifts().length &&
// 				nurse.getShift(endDay + 1) != 'O' &&
// 				nurse.getShift(endDay + 1) != 'X') {
// 				endDay++;
// 			}
//
// 			// 시퀀스가 2일 이상인 경우만 처리
// 			if (endDay > startDay) {
// 				// 시퀀스 내 근무 유형 통계
// 				Map<Character, Integer> shiftCounts = new HashMap<>();
// 				for (int day = startDay; day <= endDay; day++) {
// 					char shift = nurse.getShift(day);
// 					shiftCounts.merge(shift, 1, Integer::sum);
// 				}
//
// 				// 가장 많은 근무 유형 찾기
// 				char dominantShift = 'O';
// 				int maxCount = 0;
// 				for (Map.Entry<Character, Integer> entry : shiftCounts.entrySet()) {
// 					if (entry.getValue() > maxCount) {
// 						maxCount = entry.getValue();
// 						dominantShift = entry.getKey();
// 					}
// 				}
//
// 				// 모든 근무를 지배적 유형으로 통일 (80% 확률로 적용)
// 				if (random.nextDouble() < 0.8 && nurse.canWorkShift(dominantShift)) {
// 					for (int day = startDay; day <= endDay; day++) {
// 						nurse.setShift(day, dominantShift);
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 근무 시퀀스 시작점 찾기
// 	 */
// 	private List<Integer> findWorkSequences(Solution.Nurse nurse) {
// 		List<Integer> sequences = new ArrayList<>();
// 		boolean inSequence = false;
//
// 		for (int day = 1; day <= nurse.getShifts().length; day++) {
// 			char shift = nurse.getShift(day);
//
// 			if (shift != 'O' && shift != 'X') {
// 				if (!inSequence) {
// 					sequences.add(day);
// 					inSequence = true;
// 				}
// 			} else {
// 				inSequence = false;
// 			}
// 		}
//
// 		return sequences;
// 	}
//
// 	/**
// 	 * 야간 근무 패턴 개선 돌연변이
// 	 */
// 	private void nightShiftPatternMutation(List<Solution.Nurse> nurses) {
// 		// 야간 근무 가능한 간호사만 필터링
// 		List<Solution.Nurse> nightEligibleNurses = nurses.stream()
// 			.filter(nurse -> nurse.canWorkShift('N'))
// 			.collect(Collectors.toList());
//
// 		if (nightEligibleNurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nightEligibleNurses.size());
// 		Solution.Nurse nurse = nightEligibleNurses.get(nurseIdx);
//
// 		// 1. 단일 야간 근무 찾기
// 		List<Integer> singleNights = new ArrayList<>();
// 		for (int day = 1; day < nurse.getShifts().length; day++) {
// 			if (nurse.getShift(day) == 'N') {
// 				boolean prevIsNotNight = day == 1 || nurse.getShift(day - 1) != 'N';
// 				boolean nextIsNotNight = day == nurse.getShifts().length - 1 || nurse.getShift(day + 1) != 'N';
//
// 				if (prevIsNotNight && nextIsNotNight) {
// 					singleNights.add(day);
// 				}
// 			}
// 		}
//
// 		if (!singleNights.isEmpty()) {
// 			// 무작위 단일 야간 근무 선택
// 			int dayIdx = random.nextInt(singleNights.size());
// 			int day = singleNights.get(dayIdx);
//
// 			// 전략: 이전 날이나 다음 날도 야간으로 변경
// 			boolean modifyNext = day < nurse.getShifts().length &&
// 				(nurse.getShift(day + 1) == 'O' || nurse.getShift(day + 1) == 'X');
//
// 			boolean modifyPrev = day > 1 &&
// 				(nurse.getShift(day - 1) == 'O' || nurse.getShift(day - 1) == 'X');
//
// 			if (modifyNext && (modifyPrev ? random.nextBoolean() : true)) {
// 				nurse.setShift(day + 1, 'N');
// 			} else if (modifyPrev) {
// 				nurse.setShift(day - 1, 'N');
// 			}
// 		} else {
// 			// 2. 연속 야간 근무 확장/축소
// 			List<Integer> nightSequences = new ArrayList<>();
// 			boolean inSequence = false;
// 			int seqStart = 0;
//
// 			for (int day = 1; day <= nurse.getShifts().length; day++) {
// 				if (nurse.getShift(day) == 'N') {
// 					if (!inSequence) {
// 						seqStart = day;
// 						inSequence = true;
// 					}
// 				} else {
// 					if (inSequence) {
// 						if (day - seqStart >= 2) { // 2일 이상 연속 야간
// 							nightSequences.add(seqStart);
// 						}
// 						inSequence = false;
// 					}
// 				}
// 			}
//
// 			if (inSequence && nurse.getShifts().length - seqStart + 1 >= 2) {
// 				nightSequences.add(seqStart);
// 			}
//
// 			if (!nightSequences.isEmpty()) {
// 				int seqIdx = random.nextInt(nightSequences.size());
// 				int start = nightSequences.get(seqIdx);
//
// 				// 시퀀스 길이 계산
// 				int length = 0;
// 				for (int day = start; day <= nurse.getShifts().length; day++) {
// 					if (nurse.getShift(day) == 'N') {
// 						length++;
// 					} else {
// 						break;
// 					}
// 				}
//
// 				// 50% 확률로 확장 또는 축소
// 				if (random.nextBoolean() && start > 1 &&
// 					(nurse.getShift(start - 1) == 'O' || nurse.getShift(start - 1) == 'X')) {
// 					// 앞으로 확장
// 					nurse.setShift(start - 1, 'N');
// 				} else if (length > 2) {
// 					// 축소 (최소 2일은 유지)
// 					nurse.setShift(start + length - 1, 'O');
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * NOD 패턴 수정 돌연변이
// 	 */
// 	private void nodPatternMutation(List<Solution.Nurse> nurses) {
// 		if (nurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nurses.size());
// 		Solution.Nurse nurse = nurses.get(nurseIdx);
//
// 		// NOD 패턴 찾기
// 		List<Integer> nodPatterns = new ArrayList<>();
// 		for (int day = 1; day <= nurse.getShifts().length - 2; day++) {
// 			if (nurse.getShift(day) == 'N' &&
// 				nurse.getShift(day + 1) == 'O' &&
// 				nurse.getShift(day + 2) == 'D') {
// 				nodPatterns.add(day);
// 			}
// 		}
//
// 		if (!nodPatterns.isEmpty()) {
// 			// 무작위 NOD 패턴 선택
// 			int patternIdx = random.nextInt(nodPatterns.size());
// 			int day = nodPatterns.get(patternIdx);
//
// 			// 무작위로 수정 전략 선택
// 			int strategy = random.nextInt(3);
//
// 			switch (strategy) {
// 				case 0: // N 변경
// 					if (nurse.canWorkShift('E')) {
// 						nurse.setShift(day, 'E');
// 					} else {
// 						nurse.setShift(day, 'O');
// 					}
// 					break;
//
// 				case 1: // O 변경
// 					if (nurse.canWorkShift('E')) {
// 						nurse.setShift(day + 1, 'E');
// 					} else if (nurse.canWorkShift('N')) {
// 						nurse.setShift(day + 1, 'N');
// 					} else {
// 						nurse.setShift(day + 1, 'D');
// 					}
// 					break;
//
// 				case 2: // D 변경
// 					if (nurse.canWorkShift('E')) {
// 						nurse.setShift(day + 2, 'E');
// 					} else if (nurse.canWorkShift('N')) {
// 						nurse.setShift(day + 2, 'N');
// 					} else {
// 						nurse.setShift(day + 2, 'O');
// 					}
// 					break;
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 월말-월초 패턴 처리 돌연변이
// 	 */
// 	private void monthTransitionMutation(
// 		List<Solution.Nurse> nurses,
// 		Map<Long, String> prevMonthSchedules,
// 		Rule rule) {
//
// 		// 이전 달 마지막 날이 야간인 간호사 찾기
// 		List<Solution.Nurse> nightEndNurses = new ArrayList<>();
// 		for (Solution.Nurse nurse : nurses) {
// 			String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 			if (prevSchedule != null && !prevSchedule.isEmpty() &&
// 				prevSchedule.charAt(prevSchedule.length() - 1) == 'N') {
// 				nightEndNurses.add(nurse);
// 			}
// 		}
//
// 		if (nightEndNurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nightEndNurses.size());
// 		Solution.Nurse nurse = nightEndNurses.get(nurseIdx);
//
// 		// 이전 달 연속 야간 일수 계산
// 		String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 		int consecutiveNights = 1; // 마지막 날 포함
// 		for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 			if (prevSchedule.charAt(i) == 'N') {
// 				consecutiveNights++;
// 			} else {
// 				break;
// 			}
// 		}
//
// 		// 최대 연속 야간 근무 초과 여부 확인
// 		if (consecutiveNights >= rule.getMaxN() && nurse.getShift(1) == 'N') {
// 			// 첫날을 휴무로 변경
// 			nurse.setShift(1, 'O');
//
// 			// 추가 휴식 적용
// 			int restDays = rule.getOffCntAfterN();
// 			for (int day = 2; day <= Math.min(restDays, nurse.getShifts().length); day++) {
// 				nurse.setShift(day, 'O');
// 			}
// 		}
// 		// 연속 야간 일수가 최대값보다 작고, 현재 첫날이 휴무인 경우 야간으로 변경 고려
// 		else if (consecutiveNights < rule.getMaxN() &&
// 			nurse.getShift(1) == 'O' &&
// 			nurse.canWorkShift('N')) {
// 			// 70% 확률로 야간으로 변경
// 			if (random.nextDouble() < 0.7) {
// 				nurse.setShift(1, 'N');
//
// 				// 최대 연속 야간을 초과하지 않도록 확인
// 				int maxAdditional = rule.getMaxN() - consecutiveNights;
// 				int currentAdditional = 1;
//
// 				// 현재 첫날부터 야간인 연속 일수 확인
// 				for (int day = 2; day <= nurse.getShifts().length; day++) {
// 					if (nurse.getShift(day) == 'N') {
// 						currentAdditional++;
// 					} else {
// 						break;
// 					}
// 				}
//
// 				// 초과하면 일부 야간을 휴무로 변경
// 				if (currentAdditional > maxAdditional) {
// 					for (int day = 1 + maxAdditional;
// 						 day <= Math.min(1 + currentAdditional - 1, nurse.getShifts().length); day++) {
// 						nurse.setShift(day, 'O');
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 근무-휴무 패턴 수정 돌연변이
// 	 */
// 	private void workOffPatternMutation(List<Solution.Nurse> nurses) {
// 		if (nurses.isEmpty())
// 			return;
//
// 		// 무작위 간호사 선택
// 		int nurseIdx = random.nextInt(nurses.size());
// 		Solution.Nurse nurse = nurses.get(nurseIdx);
//
// 		// 근무-휴무-근무-휴무 패턴 찾기
// 		for (int i = 1; i <= nurse.getShifts().length - 3; i++) {
// 			if (nurse.getShift(i) != 'O' && nurse.getShift(i) != 'X' &&
// 				(nurse.getShift(i + 1) == 'O' || nurse.getShift(i + 1) == 'X') &&
// 				nurse.getShift(i + 2) != 'O' && nurse.getShift(i + 2) != 'X' &&
// 				(nurse.getShift(i + 3) == 'O' || nurse.getShift(i + 3) == 'X')) {
//
// 				// 패턴 발견, 수정 전략 선택
// 				int strategy = random.nextInt(3);
//
// 				switch (strategy) {
// 					case 0: // 첫 휴무 제거 (연속 근무로)
// 						nurse.setShift(i + 1, nurse.getShift(i));
// 						return;
//
// 					case 1: // 두번째 휴무 제거
// 						nurse.setShift(i + 3, nurse.getShift(i + 2));
// 						return;
//
// 					case 2: // 근무 유형 통일
// 						char unifiedShift = nurse.getShift(i);
// 						if (nurse.canWorkShift(unifiedShift)) {
// 							nurse.setShift(i + 2, unifiedShift);
// 						}
// 						return;
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 해결책 수리 - 제약 조건을 심각하게 위반하는 부분 수정
// 	 */
// 	private void repairSolution(
// 		Solution solution,
// 		Rule rule,
// 		Map<Long, String> prevMonthSchedules,
// 		YearMonth yearMonth,
// 		Map<Long, Integer> nurseShiftFlags) {
//
// 		List<Solution.Nurse> nurses = solution.getNurses();
//
// 		// 1. 근무 유형 제약 위반 수정
// 		repairShiftTypeViolations(nurses, nurseShiftFlags);
//
// 		// 2. 야간 근무 단일 패턴 수정
// 		repairSingleNightShifts(nurses);
//
// 		// 3. 최대 연속 야간 근무 수정
// 		repairConsecutiveNights(nurses, rule);
//
// 		// 4. 월말-월초 패턴 수정
// 		repairMonthTransitions(nurses, prevMonthSchedules, rule);
//
// 		// 5. 일별 필요 인원 조정
// 		repairDailyRequirements(solution);
// 	}
//
// 	/**
// 	 * 근무 유형 제약 위반 수정
// 	 */
// 	private void repairShiftTypeViolations(List<Solution.Nurse> nurses, Map<Long, Integer> nurseShiftFlags) {
// 		for (Solution.Nurse nurse : nurses) {
// 			int shiftFlags = nurseShiftFlags.getOrDefault(nurse.getId(), ShiftType.ALL.getFlag());
//
// 			for (int day = 1; day <= nurse.getShifts().length; day++) {
// 				char shift = nurse.getShift(day);
//
// 				// 불가능한 근무 유형 할당 수정
// 				if (shift != 'O' && shift != 'X' && !nurse.canWorkShift(shift)) {
// 					// 휴무로 변경
// 					nurse.setShift(day, 'O');
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 단일 야간 근무 패턴 수정
// 	 */
// 	private void repairSingleNightShifts(List<Solution.Nurse> nurses) {
// 		for (Solution.Nurse nurse : nurses) {
// 			// 단일 야간 근무 찾기
// 			for (int day = 1; day <= nurse.getShifts().length; day++) {
// 				if (nurse.getShift(day) == 'N') {
// 					boolean prevIsNotNight = day == 1 || nurse.getShift(day - 1) != 'N';
// 					boolean nextIsNotNight = day == nurse.getShifts().length || nurse.getShift(day + 1) != 'N';
//
// 					if (prevIsNotNight && nextIsNotNight) {
// 						// 단일 야간 근무 발견, 수정 시도
//
// 						// 전략1: 다음 날도 야간으로 (가능하면)
// 						if (day < nurse.getShifts().length &&
// 							(nurse.getShift(day + 1) == 'O' || nurse.getShift(day + 1) == 'X') &&
// 							nurse.canWorkShift('N')) {
// 							nurse.setShift(day + 1, 'N');
// 						}
// 						// 전략2: 야간을 휴무로 변경
// 						else {
// 							nurse.setShift(day, 'O');
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 최대 연속 야간 근무 제약 수정
// 	 */
// 	private void repairConsecutiveNights(List<Solution.Nurse> nurses, Rule rule) {
// 		int maxConsecutiveNights = rule.getMaxN();
//
// 		for (Solution.Nurse nurse : nurses) {
// 			int consecutiveNights = 0;
// 			int startDay = 0;
//
// 			// 연속 야간 근무 찾기
// 			for (int day = 1; day <= nurse.getShifts().length; day++) {
// 				if (nurse.getShift(day) == 'N') {
// 					if (consecutiveNights == 0) {
// 						startDay = day;
// 					}
// 					consecutiveNights++;
// 				} else {
// 					// 최대 연속 야간 초과 확인
// 					if (consecutiveNights > maxConsecutiveNights) {
// 						// 초과 부분을 휴무로 변경
// 						int excessDays = consecutiveNights - maxConsecutiveNights;
// 						for (int i = 0; i < excessDays; i++) {
// 							int dayToFix = startDay + maxConsecutiveNights + i;
// 							if (dayToFix <= nurse.getShifts().length) {
// 								nurse.setShift(dayToFix, 'O');
// 							}
// 						}
// 					}
//
// 					// 연속 일수 리셋
// 					consecutiveNights = 0;
// 				}
// 			}
//
// 			// 마지막까지 계속되는 연속 야간 확인
// 			if (consecutiveNights > maxConsecutiveNights) {
// 				int excessDays = consecutiveNights - maxConsecutiveNights;
// 				for (int i = 0; i < excessDays; i++) {
// 					int dayToFix = startDay + maxConsecutiveNights + i;
// 					if (dayToFix <= nurse.getShifts().length) {
// 						nurse.setShift(dayToFix, 'O');
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 월말-월초 패턴 수정
// 	 */
// 	private void repairMonthTransitions(List<Solution.Nurse> nurses, Map<Long, String> prevMonthSchedules, Rule rule) {
// 		for (Solution.Nurse nurse : nurses) {
// 			String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 			if (prevSchedule != null && !prevSchedule.isEmpty()) {
// 				char lastPrevShift = prevSchedule.charAt(prevSchedule.length() - 1);
//
// 				// 이전 달 마지막 날이 야간 근무인 경우
// 				if (lastPrevShift == 'N') {
// 					// 현재 달 첫날이 야간이면 연속 야간 일수 확인
// 					if (nurse.getShift(1) == 'N') {
// 						// 이전 달 연속 야간 일수 계산
// 						int prevConsecutiveNights = 1; // 마지막 날 포함
// 						for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 							if (prevSchedule.charAt(i) == 'N') {
// 								prevConsecutiveNights++;
// 							} else {
// 								break;
// 							}
// 						}
//
// 						// 현재 달 연속 야간 일수 계산
// 						int currentConsecutiveNights = 1; // 첫날 포함
// 						for (int day = 2; day <= nurse.getShifts().length; day++) {
// 							if (nurse.getShift(day) == 'N') {
// 								currentConsecutiveNights++;
// 							} else {
// 								break;
// 							}
// 						}
//
// 						// 전체 연속 야간 일수 계산
// 						int totalConsecutiveNights = prevConsecutiveNights + currentConsecutiveNights - 1;
//
// 						// 최대 연속 야간 초과 확인
// 						if (totalConsecutiveNights > rule.getMaxN()) {
// 							// 초과 부분을 휴무로 변경
// 							int excessDays = totalConsecutiveNights - rule.getMaxN();
// 							for (int i = currentConsecutiveNights - excessDays + 1;
// 								 i <= currentConsecutiveNights; i++) {
// 								if (i >= 1 && i <= nurse.getShifts().length) {
// 									nurse.setShift(i, 'O');
// 								}
// 							}
// 						}
// 					}
// 					// 야간 근무 다음날 주간/저녁 근무 불가 규칙 적용
// 					else if (nurse.getShift(1) == 'D' || nurse.getShift(1) == 'E') {
// 						nurse.setShift(1, 'O');
// 					}
// 				}
//
// 				// NOD 패턴 확인 (이전 달 마지막 N, 현재 첫날 O, 둘째날 D)
// 				if (lastPrevShift == 'N' && nurse.getShift(1) == 'O' &&
// 					nurse.getShifts().length >= 2 && nurse.getShift(2) == 'D') {
// 					// NOD 패턴 수정 - 둘째날을 휴무나 다른 근무로 변경
// 					if (nurse.canWorkShift('E')) {
// 						nurse.setShift(2, 'E');
// 					} else {
// 						nurse.setShift(2, 'O');
// 					}
// 				}
// 			}
// 		}
// 	}
//
// 	/**
// 	 * 일별 필요 인원 조정
// 	 */
// 	private void repairDailyRequirements(Solution solution) {
// 		for (int day = 1; day <= solution.getDaysInMonth(); day++) {
// 			Solution.DailyRequirement req = solution.getDailyRequirements().get(day);
// 			Map<Character, Integer> currentAssignments = countShiftsForDay(solution.getNurses(), day);
//
// 			// 야간 근무 우선 조정 (가장 중요)
// 			adjustShiftCount(solution.getNurses(), day, 'N',
// 				req.getNightNurses(),
// 				currentAssignments.getOrDefault('N', 0));
//
// 			// 주간 근무 조정
// 			adjustShiftCount(solution.getNurses(), day, 'D',
// 				req.getDayNurses(),
// 				currentAssignments.getOrDefault('D', 0));
//
// 			// 저녁 근무 조정
// 			adjustShiftCount(solution.getNurses(), day, 'E',
// 				req.getEveningNurses(),
// 				currentAssignments.getOrDefault('E', 0));
// 		}
// 	}
//
// 	/**
// 	 * 최선의 해결책 찾기
// 	 */
// 	private Solution findBestSolution(List<Solution> population) {
// 		return population.stream()
// 			.min(Comparator.comparingDouble(Solution::getScore))
// 			.orElse(population.get(0));
// 	}
//
// 	/**
// 	 * 기존 반복 사용 함수들 (기존 코드와 동일하게 유지)
// 	 */
// 	// 이전달 스케줄 정보 가져오기
// 	public Map<Long, String> getPreviousMonthSchedules(List<WardSchedule.NurseShift> prevNurseShifts) {
// 		Map<Long, String> prevMonthSchedules = new HashMap<>();
// 		if (prevNurseShifts != null) {
// 			for (WardSchedule.NurseShift shift : prevNurseShifts) {
// 				String shifts = shift.getShifts();
// 				if (shifts.length() >= 4) {
// 					prevMonthSchedules.put(shift.getMemberId(),
// 						shifts.substring(shifts.length() - 4));
// 				}
// 			}
// 		}
// 		return prevMonthSchedules;
// 	}
//
// 	// 간호사 초기화
// 	private List<Solution.Nurse> initializeNurses(List<WardMember> wardMembers,
// 		int daysInMonth,
// 		Map<Long, Integer> nurseShiftFlags) {
//
// 		return wardMembers.stream()
// 			.map(wm -> {
// 				Long memberId = wm.getMember().getMemberId();
// 				char[] shifts = new char[daysInMonth];
//
// 				Arrays.fill(shifts, 'O');
//
// 				int shiftFlag = nurseShiftFlags.getOrDefault(memberId, ShiftType.ALL.getFlag());
//
// 				return Solution.Nurse.builder()
// 					.id(memberId)
// 					.shifts(shifts)
// 					.shiftFlags(shiftFlag)
// 					.build();
// 			})
// 			.collect(Collectors.toList());
// 	}
//
// 	// 일별 필요 간호사 수 계산
// 	private Map<Integer, Solution.DailyRequirement> calculateDailyRequirements(
// 		Rule rule, YearMonth yearMonth, Map<Integer, Integer> dailyNightCnt) {
//
// 		Map<Integer, Solution.DailyRequirement> requirements = new HashMap<>();
// 		for (int day = 1; day <= yearMonth.daysInMonth(); day++) {
// 			boolean isWeekend = yearMonth.isWeekend(day);
// 			requirements.put(day, Solution.DailyRequirement.builder()
// 				.dayNurses(isWeekend ? rule.getWendDCnt() : rule.getWdayDCnt())
// 				.eveningNurses(isWeekend ? rule.getWendECnt() : rule.getWdayECnt())
// 				.nightNurses(isWeekend
// 					? (rule.getWendNCnt() - dailyNightCnt.getOrDefault(day, 0))
// 					: (rule.getWdayNCnt() - dailyNightCnt.getOrDefault(day, 0)))
// 				.build());
// 		}
// 		return requirements;
// 	}
//
// 	// 이전 달 마지막 근무와의 연속성 고려
// 	private void considerPreviousMonthContinuity(List<Solution.Nurse> nurses,
// 		Map<Long, String> prevMonthSchedules,
// 		Rule rule) {
//
// 		for (Solution.Nurse nurse : nurses) {
// 			String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 			if (prevSchedule != null && !prevSchedule.isEmpty()) {
// 				char lastPrevShift = prevSchedule.charAt(prevSchedule.length() - 1);
//
// 				// 이전 달 마지막 날이 야간 근무인 경우
// 				if (lastPrevShift == 'N') {
// 					// 실제 연속 야간 근무 일수 계산 (전체 이전 달 스케줄 체크)
// 					int consecutiveNights = 1; // 이전 달 마지막 날 포함
// 					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 						if (prevSchedule.charAt(i) == 'N') {
// 							consecutiveNights++;
// 						} else {
// 							break; // 연속이 끊기면 중단
// 						}
// 					}
//
// 					// 연속 야간 근무가 최대치에 도달했는지 확인
// 					if (consecutiveNights >= rule.getMaxN()) {
// 						// 최대 연속 야간 근무 초과하거나 도달한 경우 무조건 휴무
// 						nurse.setShift(1, 'O'); // 첫날은 휴무
//
// 						// 특별히 연속 야간 후 필요한 추가 휴식 적용
// 						int extraRestDays = rule.getOffCntAfterN();
// 						for (int day = 1; day <= Math.min(extraRestDays, nurse.getShifts().length); day++) {
// 							nurse.setShift(day, 'O');
// 						}
// 					} else if (nurse.canWorkShift('N')) {
// 						// 아직 최대치에 도달하지 않았고 야간 근무 가능한 경우
// 						int remainingAllowedNights = rule.getMaxN() - consecutiveNights;
//
// 						// 남은 허용 야간 일수가 있고 확률적으로 연속성 유지
// 						if (remainingAllowedNights > 0 && random.nextDouble() < 0.7) {
// 							nurse.setShift(1, 'N'); // 첫날도 야간 근무 계속
//
// 							// 남은 야간 일수만큼 계속 배정 시도 (최대 2일까지만 추가로)
// 							int additionalNights = Math.min(remainingAllowedNights - 1, 2);
// 							for (int day = 2; day <= additionalNights + 1 && day <= nurse.getShifts().length; day++) {
// 								// 80% 확률로 야간 연속, 20%는 중단
// 								if (random.nextDouble() < 0.8) {
// 									nurse.setShift(day, 'N');
// 								} else {
// 									nurse.setShift(day, 'O'); // 휴무로 전환
// 									break; // 연속 중단
// 								}
// 							}
// 						} else {
// 							// 연속성 중단, 휴무로 전환
// 							nurse.setShift(1, 'O'); // 첫날은 휴무
// 						}
// 					} else {
// 						// 야간 근무 불가능한 경우
// 						nurse.setShift(1, 'O'); // 첫날은 무조건 휴무
// 					}
// 				}
// 				// 이전 달 마지막 날이 주간 또는 저녁 근무인 경우
// 				else if (lastPrevShift == 'D' || lastPrevShift == 'E') {
// 					// 연속 근무 일수 계산
// 					int consecutiveWorkDays = 1; // 이전 달 마지막 날 포함
// 					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 						char shift = prevSchedule.charAt(i);
// 						if (shift != 'O' && shift != 'X') {
// 							consecutiveWorkDays++;
// 						} else {
// 							break;
// 						}
// 					}
//
// 					// 근무 연속성 처리
// 					if (consecutiveWorkDays >= rule.getMaxShift()) {
// 						// 최대 연속 근무일 도달 시 휴무
// 						nurse.setShift(1, 'O');
// 					}
// 				}
// 				// 이전 달 마지막 날이 휴무인 경우 (O 또는 X) 또는 미드(M) 근무인 경우
// 				else if (lastPrevShift == 'O' || lastPrevShift == 'X' || lastPrevShift == 'M') {
// 					// 미드 근무도 휴무처럼 처리 (자동 생성 로직에서 제외)
// 					// 이 경우 기본 설정(O)으로 유지
// 				}
// 			}
// 		}
// 	}
//
// 	// 근무 인텐시티에 따라 간호사 정렬
// 	private void sortNursesByWorkIntensity(List<Solution.Nurse> nurses, Map<Long, WorkIntensity> workIntensities) {
// 		nurses.sort((n1, n2) -> {
// 			WorkIntensity i1 = workIntensities.getOrDefault(n1.getId(), WorkIntensity.MEDIUM);
// 			WorkIntensity i2 = workIntensities.getOrDefault(n2.getId(), WorkIntensity.MEDIUM);
//
// 			// HIGH가 우선, LOW가 나중
// 			if (i1 == WorkIntensity.HIGH && i2 != WorkIntensity.HIGH) {
// 				return -1;
// 			}
// 			if (i1 != WorkIntensity.HIGH && i2 == WorkIntensity.HIGH) {
// 				return 1;
// 			}
// 			if (i1 == WorkIntensity.MEDIUM && i2 == WorkIntensity.LOW) {
// 				return -1;
// 			}
// 			if (i1 == WorkIntensity.LOW && i2 == WorkIntensity.MEDIUM) {
// 				return 1;
// 			}
//
// 			return 0;
// 		});
// 	}
//
// 	// 특정 날짜의 근무 유형별 개수 계산
// 	private Map<Character, Integer> countShiftsForDay(List<Solution.Nurse> nurses, int day) {
// 		return nurses.stream()
// 			.collect(Collectors.groupingBy(
// 				nurse -> nurse.getShift(day),
// 				Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
// 			));
// 	}
//
// 	// 특정 날짜에 가능한 간호사 목록 가져오기
// 	private List<Solution.Nurse> getAvailableNursesForDay(List<Solution.Nurse> nurses, int day) {
// 		return nurses.stream()
// 			.filter(nurse -> isNurseAvailableForDay(nurse, day))
// 			.collect(Collectors.toList());
// 	}
//
// 	// 간호사가 특정 날짜에 근무 가능한지 확인
// 	private boolean isNurseAvailableForDay(Solution.Nurse nurse, int day) {
// 		// 전날이 야간이면 근무 불가
// 		if (day > 1 && nurse.getShift(day - 1) == 'N') {
// 			return false;
// 		}
//
// 		// 최대 연속 근무일 체크
// 		int consecutiveShifts = 0;
// 		for (int i = Math.max(1, day - 5); i < day; i++) {
// 			char shift = nurse.getShift(i);
// 			if (shift != 'O' && shift != 'X') {
// 				consecutiveShifts++;
// 			} else {
// 				consecutiveShifts = 0;
// 			}
// 		}
//
// 		return consecutiveShifts < 5; // 5일 연속 근무 제한
// 	}
//
// 	// 특정 날짜에 필요 인원 배정
// 	private void assignShiftsForDay(List<Solution.Nurse> availableNurses, int day,
// 		Solution.DailyRequirement requirement) {
// 		// 야간 근무부터 배정 (가장 중요)
// 		assignSpecificShift(availableNurses, day, 'N', requirement.getNightNurses());
//
// 		// 주간 근무 배정
// 		assignSpecificShift(availableNurses, day, 'D', requirement.getDayNurses());
//
// 		// 저녁 근무 배정
// 		assignSpecificShift(availableNurses, day, 'E', requirement.getEveningNurses());
// 	}
//
// 	// 특정 근무 유형 배정
// 	private void assignSpecificShift(List<Solution.Nurse> availableNurses, int day, char shiftType, int required) {
// 		if (required <= 0 || availableNurses.isEmpty()) {
// 			return;
// 		}
//
// 		// 해당 근무 유형이 가능한 간호사만 필터링
// 		List<Solution.Nurse> eligibleNurses = availableNurses.stream()
// 			.filter(nurse -> nurse.canWorkShift(shiftType))
// 			.collect(Collectors.toList());
//
// 		if (eligibleNurses.isEmpty()) {
// 			return;
// 		}
//
// 		// 야간 근무는 특별 처리
// 		if (shiftType == 'N') {
// 			assignNightShifts(eligibleNurses, day, required);
// 		} else {
// 			// 다른 근무 유형은 단순 배정
// 			for (int i = 0; i < Math.min(required, eligibleNurses.size()); i++) {
// 				int nurseIdx = random.nextInt(eligibleNurses.size());
// 				Solution.Nurse nurse = eligibleNurses.get(nurseIdx);
// 				nurse.setShift(day, shiftType);
//
// 				// 원래 목록에서도 제거
// 				availableNurses.remove(nurse);
// 				eligibleNurses.remove(nurseIdx);
// 			}
// 		}
// 	}
//
// 	// 야간 근무 특별 배정 (연속성 고려)
// 	private void assignNightShifts(List<Solution.Nurse> availableNurses, int day, int required) {
// 		int remainingRequired = required;
//
// 		// 1. 기존 야간 근무 연장 시도
// 		List<Solution.Nurse> nurses = new ArrayList<>(availableNurses);
// 		Iterator<Solution.Nurse> iterator = nurses.iterator();
//
// 		while (iterator.hasNext() && remainingRequired > 0) {
// 			Solution.Nurse nurse = iterator.next();
//
// 			if (day > 1 && nurse.getShift(day - 1) == 'N') {
// 				nurse.setShift(day, 'N');
// 				availableNurses.remove(nurse);
// 				remainingRequired--;
// 			}
// 		}
//
// 		// 2. 새로운 야간 근무 배정
// 		Collections.shuffle(availableNurses);
//
// 		for (int i = 0; i < Math.min(remainingRequired, availableNurses.size()); i++) {
// 			Solution.Nurse nurse = availableNurses.get(i);
// 			nurse.setShift(day, 'N');
//
// 			// 최소 야간 연속성 보장 (다음날도 야간으로 설정 시도)
// 			if (day < nurse.getShifts().length &&
// 				(nurse.getShift(day + 1) == 'O' || nurse.getShift(day + 1) == 'X')) {
// 				nurse.setShift(day + 1, 'N');
// 			}
// 		}
// 	}
//
// 	private double evaluateShiftRequirements(Solution solution) {
// 		double violations = 0;
// 		for (int day = 1; day <= solution.getDaysInMonth(); day++) {
// 			Map<Character, Integer> counts = countShiftsForDay(solution.getNurses(), day);
// 			Solution.DailyRequirement req = solution.getDailyRequirements().get(day);
//
// 			// 야간 근무 위반은 더 높은 패널티 부여
// 			int nightDiff = Math.abs(counts.getOrDefault('N', 0) - req.getNightNurses());
// 			violations += nightDiff * 50; // 야간 근무 위반에 50배 패널티
//
// 			// 일반 근무 요구사항 위반
// 			violations += Math.abs(counts.getOrDefault('D', 0) - req.getDayNurses());
// 			violations += Math.abs(counts.getOrDefault('E', 0) - req.getEveningNurses());
// 		}
// 		return violations;
// 	}
//
// 	private double evaluatePreviousMonthConstraints(Solution solution, Map<Long, String> prevMonthSchedules,
// 		Rule rule) {
// 		double violations = 0;
//
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 			if (prevSchedule != null && !prevSchedule.isEmpty()) {
// 				char lastPrevShift = prevSchedule.charAt(prevSchedule.length() - 1);
// 				char firstCurrentShift = nurse.getShift(1);
//
// 				// 이전 달 마지막 날이 야간 근무인 경우
// 				if (lastPrevShift == 'N') {
// 					// 야간 -> 주간/저녁 패턴은 위반 (야간 근무 후 바로 주간이나 저녁 근무 불가)
// 					if (firstCurrentShift == 'D' || firstCurrentShift == 'E') {
// 						violations += 100;  // 높은 패널티
// 					}
//
// 					// 야간 근무 후 바로 휴무가 아닌 경우 (N -> O 아닌 경우) 패널티
// 					// 단, 야간 연속성 (N -> N)은 예외로 검사
// 					if (firstCurrentShift != 'O' && firstCurrentShift != 'N') {
// 						violations += 50;
// 					}
//
// 					// 야간 연속성 체크 (이전 달 마지막과 이번 달이 연속될 때만)
// 					if (firstCurrentShift == 'N') {
// 						// 이전 달 연속 야간 근무 일수 계산
// 						int prevMonthConsecutiveNights = 1; // 마지막 날
// 						for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 							if (prevSchedule.charAt(i) == 'N') {
// 								prevMonthConsecutiveNights++;
// 							} else {
// 								break;
// 							}
// 						}
//
// 						// 현재 달 연속 야간 근무 일수 계산
// 						int currentMonthConsecutiveNights = 1; // 첫날
// 						for (int day = 2; day <= solution.getDaysInMonth(); day++) {
// 							if (nurse.getShift(day) == 'N') {
// 								currentMonthConsecutiveNights++;
// 							} else {
// 								break;
// 							}
// 						}
//
// 						// 전체 연속 야간 근무 일수
// 						int totalConsecutiveNights =
// 							prevMonthConsecutiveNights + currentMonthConsecutiveNights - 1; // 중복 카운트 방지
//
// 						// 최대 연속 야간 초과 시 패널티 (매우 높은 패널티 적용)
// 						if (totalConsecutiveNights > rule.getMaxN()) {
// 							violations += (totalConsecutiveNights - rule.getMaxN()) * 30;
// 						}
// 					}
//
// 					// NOD 패턴 체크: 이전 달 마지막 날 N, 첫날 O, 둘째날 D인 경우
// 					if (firstCurrentShift == 'O' && solution.getDaysInMonth() >= 2) {
// 						if (nurse.getShift(2) == 'D') {
// 							violations += 40; // NOD 패턴에 높은 패널티
// 						}
// 					}
// 				}
//
// 				// 연속 근무일수 체크
// 				int consecutiveShifts = 0;
// 				// 이전 달 마지막 부분 체크
// 				for (int i = prevSchedule.length() - 1; i >= 0; i--) {
// 					char shift = prevSchedule.charAt(i);
// 					if (shift != 'O' && shift != 'X') {
// 						consecutiveShifts++;
// 					} else {
// 						break;
// 					}
// 				}
//
// 				// 현재 달 시작 부분 체크
// 				for (int day = 1; day <= solution.getDaysInMonth(); day++) {
// 					char shift = nurse.getShift(day);
// 					if (shift != 'O' && shift != 'X') {
// 						consecutiveShifts++;
// 					} else {
// 						break;
// 					}
// 				}
//
// 				// 최대 연속 근무일수(rule.getMaxShift()) 초과시 패널티
// 				if (consecutiveShifts > rule.getMaxShift()) {
// 					violations += (consecutiveShifts - rule.getMaxShift()) * 5;  // 가중치 5 적용
// 				}
//
// 				// 야간 연속 근무 체크
// 				if (lastPrevShift == 'N' && firstCurrentShift == 'N') {
// 					int consecutiveNights = 1; // 이전 달 마지막 날 포함
// 					for (int i = prevSchedule.length() - 2; i >= 0; i--) {
// 						if (prevSchedule.charAt(i) == 'N') {
// 							consecutiveNights++;
// 						} else {
// 							break;
// 						}
// 					}
// 					for (int day = 2; day <= solution.getDaysInMonth(); day++) {
// 						if (nurse.getShift(day) == 'N') {
// 							consecutiveNights++;
// 						} else {
// 							break;
// 						}
// 					}
// 					if (consecutiveNights > rule.getMaxN()) {
// 						violations += (consecutiveNights - rule.getMaxN()) * 8; // 가중치 8 적용
// 					}
//
// 					// 단일 야간 근무 체크 (이전 달 마지막 N, 현재 달 첫날 N, 둘째날 야간 아님)
// 					if (solution.getDaysInMonth() >= 2 && nurse.getShift(2) != 'N') {
// 						// 이전 달의 N이 단일이었는지 확인
// 						boolean wasSingleNight = prevSchedule.length() < 2
// 							|| prevSchedule.charAt(prevSchedule.length() - 2) != 'N';
//
// 						// 현재 단일 야간이라면 (연속 2일만 N)
// 						if (wasSingleNight) {
// 							violations += 15; // 단일 야간 패널티
// 						}
// 					}
// 				}
//
// 				// 이전 달 마지막과 현재 달 첫날의 근무 패턴 체크
// 				if (lastPrevShift == 'E' && firstCurrentShift == 'D') {
// 					violations += 10; // 저녁->주간 패턴에 패널티
// 				}
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	private double evaluateConsecutiveShifts(Solution solution, Rule rule) {
// 		double violations = 0;
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			int consecutiveShifts = 0;
// 			int consecutiveNights = 0;
// 			int consecutiveOffs = 0;  // 연속 휴무 일수 추적
// 			int maxConsecutiveOffs = 3;  // 최대 허용 연속 휴무 일수 (조정 가능)
//
// 			for (int day = 1; day <= solution.getDaysInMonth(); day++) {
// 				char shift = nurse.getShift(day);
// 				if (shift == 'O' || shift == 'X') {
// 					// 휴식일 발생
// 					consecutiveOffs++;
//
// 					// 휴식일 발생시 단일 야간 패턴 확인
// 					if (consecutiveNights == 1) {
// 						violations += 10;
// 					}
// 					consecutiveShifts = 0;
// 					consecutiveNights = 0;
// 				} else {
// 					// 너무 긴 연속 휴무에 대한 패널티 부여
// 					if (consecutiveOffs > maxConsecutiveOffs) {
// 						violations += (consecutiveOffs - maxConsecutiveOffs) * 5;  // 초과 일수당 5점 패널티
// 					}
// 					consecutiveOffs = 0;  // 근무일이 시작되면 연속 휴무 카운트 리셋
//
// 					consecutiveShifts++;
// 					if (shift == 'N') {
// 						consecutiveNights++;
// 					} else {
// 						// 단일 야간 근무에 높은 패널티 부여
// 						if (consecutiveNights == 1) {
// 							violations += 15; // 단일 야간 근무에 대한 패널티 증가
// 						}
// 						consecutiveNights = 0;
// 					}
// 				}
//
// 				if (consecutiveShifts > rule.getMaxShift()) {
// 					violations++;
// 				}
// 				if (consecutiveNights > rule.getMaxN()) {
// 					violations += 15;
// 				}
// 			}
//
// 			// 월말 최종 확인
// 			if (consecutiveNights == 1) {
// 				violations += 15;
// 			}
//
// 			if (consecutiveShifts == 1) {
// 				violations += 10;
// 			}
//
// 			// 월말에 연속 휴무 확인
// 			if (consecutiveOffs > maxConsecutiveOffs) {
// 				violations += (consecutiveOffs - maxConsecutiveOffs) * 5;
// 			}
// 		}
// 		return violations;
// 	}
//
// 	// 연속 근무 시 같은 유형의 근무를 유지하는지 평가하는 함수
// 	private double evaluateShiftConsistency(Solution solution) {
// 		double violations = 0;
//
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			char[] shifts = nurse.getShifts();
// 			char currentShiftType = 'X'; // 초기값
// 			int consecutiveWorkDays = 0;
// 			int shiftTypeChanges = 0;
//
// 			for (int day = 0; day < shifts.length; day++) {
// 				char shift = shifts[day];
//
// 				// 근무일인 경우 (O와 X가 아닌 경우)
// 				if (shift != 'O' && shift != 'X') {
// 					consecutiveWorkDays++;
//
// 					// 이전에도 근무일이었다면 유형 변경 체크
// 					if (consecutiveWorkDays > 1) {
// 						if (currentShiftType != shift && currentShiftType != 'X') {
// 							shiftTypeChanges++;
//
// 							// 연속 근무 길이에 따라 다른 패널티 적용
// 							// 2~4일 연속 근무에서 유형 변경시 더 높은 패널티
// 							if (consecutiveWorkDays >= 2 && consecutiveWorkDays <= 4) {
// 								violations += 5; // 높은 패널티
// 							} else {
// 								violations += 2; // 일반 패널티
// 							}
// 						}
// 					}
//
// 					currentShiftType = shift;
// 				} else {
// 					// 휴무일이 시작되면 연속 근무 카운터 초기화
// 					consecutiveWorkDays = 0;
// 					currentShiftType = 'X';
// 				}
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	private double evaluateShiftPatterns(Solution solution) {
// 		double violations = 0;
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			for (int day = 2; day <= solution.getDaysInMonth(); day++) {
// 				char prevShift = nurse.getShift(day - 1);
// 				char currentShift = nurse.getShift(day);
//
// 				if (prevShift == 'N' && (currentShift == 'D' || currentShift == 'E')) {
// 					violations += 2;
// 				}
// 				if (prevShift == 'E' && currentShift == 'D') {
// 					violations++;
// 				}
// 			}
// 		}
// 		return violations;
// 	}
//
// 	// 근무 요청 평가 메서드
// 	private double evaluateShiftRequests(Solution solution, List<ShiftRequest> requests) {
// 		if (requests == null || requests.isEmpty()) {
// 			return 0;
// 		}
//
// 		double violations = 0;
// 		for (ShiftRequest request : requests) {
// 			Solution.Nurse nurse = solution.getNurses().stream()
// 				.filter(n -> n.getId().equals(request.getNurseId()))
// 				.findFirst()
// 				.orElse(null);
//
// 			if (nurse != null) {
// 				if (nurse.getShift(request.getDay()) != request.getRequestedShift()) {
// 					// 강화된 요청에 대해 더 높은 패널티 적용
// 					violations += request.isReinforced() ? 3.0 : 1.0;  // 예: 강화된 요청은 3배 가중치
// 				}
// 			}
// 		}
// 		return violations;
// 	}
//
// 	private double evaluateWorkloadBalance(Solution solution) {
// 		Map<Character, List<Integer>> shiftCounts = new HashMap<>();
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			Map<Character, Integer> counts = new HashMap<>();
// 			for (char shift : nurse.getShifts()) {
// 				counts.merge(shift, 1, Integer::sum);
// 			}
// 			for (Map.Entry<Character, Integer> entry : counts.entrySet()) {
// 				shiftCounts.computeIfAbsent(entry.getKey(), k -> new ArrayList<>())
// 					.add(entry.getValue());
// 			}
// 		}
//
// 		return shiftCounts.values().stream()
// 			.mapToDouble(this::calculateStandardDeviation)
// 			.sum();
// 	}
//
// 	private double evaluateWorkIntensityBalance(Solution solution, Map<Long, WorkIntensity> workIntensities) {
// 		double violations = 0;
// 		int daysInMonth = solution.getDaysInMonth();
//
// 		// LOW 강도 간호사만 있는지 확인
// 		boolean onlyLowExists = solution.getNurses().stream()
// 			.allMatch(nurse -> workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM) == WorkIntensity.LOW);
//
// 		// 전체 근무 배정 현황 계산
// 		Map<Long, Map<Character, Integer>> nurseShiftCounts = new HashMap<>();
//
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			Map<Character, Integer> counts = new HashMap<>();
// 			for (char shift : nurse.getShifts()) {
// 				counts.merge(shift, 1, Integer::sum);
// 			}
// 			nurseShiftCounts.put(nurse.getId(), counts);
// 		}
//
// 		// 워크 인텐시티에 따른 평가
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			WorkIntensity intensity = workIntensities.getOrDefault(nurse.getId(), WorkIntensity.MEDIUM);
// 			Map<Character, Integer> counts = nurseShiftCounts.get(nurse.getId());
//
// 			// 근무 일수 비율 계산 (D + E + N)
// 			int workDays = counts.getOrDefault('D', 0) + counts.getOrDefault('E', 0) + counts.getOrDefault('N', 0);
// 			double workRatio = (double)workDays / daysInMonth;
//
// 			// 각 근무 강도별 목표 근무 비율
// 			double targetRatio;
// 			switch (intensity) {
// 				case HIGH:
// 					targetRatio = 0.7; // 70% 근무 (HIGH는 더 많이 근무)
// 					break;
// 				case LOW:
// 					targetRatio = 0.5; // 50% 근무 (LOW는 덜 근무)
// 					break;
// 				case MEDIUM:
// 				default:
// 					targetRatio = 0.6; // 60% 근무 (중간 정도 근무)
// 					break;
// 			}
//
// 			// 목표 비율과의 차이에 따른 페널티
// 			double diff = Math.abs(workRatio - targetRatio);
//
// 			// 강도별 다른 가중치 적용
// 			if (intensity == WorkIntensity.LOW) {
// 				// LOW 강도 간호사에게 더 높은 가중치 적용
// 				double weightMultiplier = 3.0; // 3배 가중치
//
// 				// LOW 강도 간호사만 있는 경우 추가 가중치 적용
// 				if (onlyLowExists) {
// 					weightMultiplier = 5.0; // 5배 가중치
// 				}
//
// 				// 목표보다 더 많이 일하는 경우 (workRatio > targetRatio) 페널티 추가
// 				if (workRatio > targetRatio) {
// 					weightMultiplier *= 1.5; // 추가 50% 페널티
// 				}
//
// 				violations += diff * 100 * weightMultiplier;
// 			} else if (intensity == WorkIntensity.HIGH) {
// 				// HIGH 강도 간호사는 일반 가중치
// 				violations += diff * 100;
// 			} else {
// 				// MEDIUM 강도 간호사는 일반 가중치
// 				violations += diff * 100;
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	private double evaluateShiftTypeConstraints(Solution solution) {
// 		double violations = 0;
//
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			// 특정 근무 타입만 가능한 간호사 처리
// 			boolean isSpecificShiftNurse = nurse.getShiftFlags() == ShiftType.D.getFlag() ||
// 				nurse.getShiftFlags() == ShiftType.E.getFlag() ||
// 				nurse.getShiftFlags() == ShiftType.N.getFlag() ||
// 				nurse.getShiftFlags() == ShiftType.M.getFlag();
//
// 			for (int day = 1; day <= solution.getDaysInMonth(); day++) {
// 				char shift = nurse.getShift(day);
//
// 				// 근무 불가능한 유형이 배정된 경우 패널티
// 				if (!nurse.canWorkShift(shift) && shift != 'O' && shift != 'X') {
// 					violations += 200; // 높은 패널티
// 				}
//
// 				// 특정 근무 타입만 가능한 간호사가 다른 근무를 하는 경우 더 높은 패널티
// 				if (isSpecificShiftNurse && shift != 'O' && shift != 'X') {
// 					int nurseShiftFlag = nurse.getShiftFlags();
// 					boolean isValidShift = false;
//
// 					switch (shift) {
// 						case 'D':
// 							isValidShift = (nurseShiftFlag & ShiftType.D.getFlag()) != 0;
// 							break;
// 						case 'E':
// 							isValidShift = (nurseShiftFlag & ShiftType.E.getFlag()) != 0;
// 							break;
// 						case 'N':
// 							isValidShift = (nurseShiftFlag & ShiftType.N.getFlag()) != 0;
// 							break;
// 						case 'M':
// 							isValidShift = (nurseShiftFlag & ShiftType.M.getFlag()) != 0;
// 							break;
// 					}
//
// 					if (!isValidShift) {
// 						violations += 500; // 매우 높은 패널티
// 					}
// 				}
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	private double calculateStandardDeviation(List<Integer> numbers) {
// 		double mean = numbers.stream().mapToInt(i -> i).average().orElse(0);
// 		return Math.sqrt(numbers.stream()
// 			.mapToDouble(i -> Math.pow(i - mean, 2))
// 			.average()
// 			.orElse(0));
// 	}
//
// 	private double evaluateAlternatingWorkPattern(Solution solution) {
// 		double violations = 0;
//
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			char[] shifts = nurse.getShifts();
//
// 			// 최소 4일 이상의 패턴이 필요함 (근무-휴무-근무-휴무)
// 			for (int i = 0; i < shifts.length - 3; i++) {
// 				// 근무-휴무-근무-휴무 패턴 체크
// 				if (shifts[i] != 'O' && shifts[i] != 'X' &&
// 					(shifts[i + 1] == 'O' || shifts[i + 1] == 'X') &&
// 					shifts[i + 2] != 'O' && shifts[i + 2] != 'X' &&
// 					(shifts[i + 3] == 'O' || shifts[i + 3] == 'X')) {
//
// 					// 더 긴 패턴도 체크 (패턴이 계속되는지)
// 					int patternLength = 2; // 기본 패턴 길이 (근무-휴무)
// 					for (int j = i + 4; j < shifts.length - 1; j += 2) {
// 						if (shifts[j] != 'O' && shifts[j] != 'X' &&
// 							(shifts[j + 1] == 'O' || shifts[j + 1] == 'X')) {
// 							patternLength++;
// 						} else {
// 							break;
// 						}
// 					}
//
// 					// 패턴이 길수록 더 큰 패널티 부여
// 					violations += patternLength * 2;
//
// 					// 이미 패턴을 찾았으니 다음 검색은 패턴 이후부터
// 					i += patternLength * 2 - 1;
// 				}
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	private double evaluateNodPatterns(Solution solution, Map<Long, String> prevMonthSchedules) {
// 		double violations = 0;
//
// 		// 기존 월내 NOD 패턴 체크
// 		for (Solution.Nurse nurse : solution.getNurses()) {
// 			for (int day = 1; day <= solution.getDaysInMonth() - 2; day++) {
// 				if (nurse.hasNodPattern(day - 1)) {
// 					violations += 10;
// 				}
// 			}
//
// 			// 월말-월초 NOD 패턴 체크
// 			String prevSchedule = prevMonthSchedules.get(nurse.getId());
// 			if (prevSchedule != null && prevSchedule.length() >= 2) {
// 				// 이전 달 마지막 날이 N
// 				if (prevSchedule.charAt(prevSchedule.length() - 1) == 'N') {
// 					// 현재 달 첫날이 O
// 					if (solution.getDaysInMonth() >= 2 && nurse.getShift(1) == 'O') {
// 						// 현재 달 둘째날이 D -> NOD 패턴
// 						if (nurse.getShift(2) == 'D') {
// 							violations += 20; // 월말-월초 NOD 패턴에 더 높은 패널티
// 						}
// 					}
// 				}
// 			}
// 		}
//
// 		return violations;
// 	}
//
// 	// 최종 결과 적용
// 	private WardSchedule applyFinalSchedule(WardSchedule wardSchedule, Solution solution, Long currentMemberId) {
// 		List<WardSchedule.NurseShift> nurseShifts = solution.getNurses().stream()
// 			.map(nurse -> WardSchedule.NurseShift.builder()
// 				.memberId(nurse.getId())
// 				.shifts(new String(nurse.getShifts()))
// 				.build())
// 			.collect(Collectors.toList());
//
// 		WardSchedule.History history = WardSchedule.History.builder()
// 			.memberId(currentMemberId)
// 			.name("auto")
// 			.before("X")
// 			.after("X")
// 			.modifiedDay(0)
// 			.isAutoCreated(true)
// 			.build();
//
// 		WardSchedule.Duty newDuty = WardSchedule.Duty.builder()
// 			.idx(wardSchedule.getNowIdx() + 1)
// 			.duty(nurseShifts)
// 			.history(history)
// 			.build();
//
// 		List<WardSchedule.Duty> duties = wardSchedule.getDuties().subList(0, wardSchedule.getNowIdx() + 1);
// 		duties.add(newDuty);
//
// 		return WardSchedule.builder()
// 			.id(wardSchedule.getId())
// 			.wardId(wardSchedule.getWardId())
// 			.year(wardSchedule.getYear())
// 			.month(wardSchedule.getMonth())
// 			.nowIdx(wardSchedule.getNowIdx() + 1)
// 			.duties(duties)
// 			.build();
// 	}
//
// 	/**
// 	 * Solution 클래스 (기존 코드와 유사하나 setter 추가)
// 	 */
// 	@Getter
// 	@Builder
// 	private static class Solution {
// 		private final int daysInMonth;
// 		private final List<Nurse> nurses;
// 		private final Map<Integer, DailyRequirement> dailyRequirements;
//
// 		@Setter
// 		private double score;
//
// 		public Solution copy() {
// 			return Solution.builder()
// 				.daysInMonth(daysInMonth)
// 				.nurses(nurses.stream().map(Nurse::copy).collect(Collectors.toList()))
// 				.dailyRequirements(new HashMap<>(dailyRequirements))
// 				.score(score)
// 				.build();
// 		}
//
// 		@Getter
// 		@Builder
// 		static class Nurse {
// 			private final Long id;
// 			private final char[] shifts; // D(주간), E(저녁), N(야간), O(휴무), X(고정)
// 			private final int shiftFlags; // 가능한 근무 유형 플래그 (비트마스크)
//
// 			public void setShift(int day, char shift) {
// 				// 근무 가능 여부 확인 후 설정
// 				if (canWorkShift(shift) || shift == 'O' || shift == 'X') {
// 					shifts[day - 1] = shift;
// 				}
// 			}
//
// 			public char getShift(int day) {
// 				return shifts[day - 1];
// 			}
//
// 			public Nurse copy() {
// 				return Nurse.builder()
// 					.id(id)
// 					.shifts(Arrays.copyOf(shifts, shifts.length))
// 					.shiftFlags(shiftFlags)  // shiftFlags 복사 추가
// 					.build();
// 			}
//
// 			// 특정 근무 유형 가능한지 확인하는 메서드
// 			public boolean canWorkShift(char shift) {
// 				switch (shift) {
// 					case 'D':
// 						return (shiftFlags & ShiftType.D.getFlag()) != 0;
// 					case 'E':
// 						return (shiftFlags & ShiftType.E.getFlag()) != 0;
// 					case 'N':
// 						return (shiftFlags & ShiftType.N.getFlag()) != 0;
// 					case 'M':
// 						return (shiftFlags & ShiftType.M.getFlag()) != 0;
// 					case 'O':
// 						return true; // 휴무는 항상 가능
// 					case 'X':
// 						return true; // 고정 근무도 항상 가능
// 					default:
// 						return false;
// 				}
// 			}
//
// 			public boolean hasNodPattern(int startDay) {
// 				if (startDay + 2 >= shifts.length) {
// 					return false;
// 				}
//
// 				return shifts[startDay] == 'N'
// 					&& shifts[startDay + 1] == 'O'
// 					&& shifts[startDay + 2] == 'D';
// 			}
// 		}
//
// 		@Getter
// 		@Builder
// 		static class DailyRequirement {
// 			private final int dayNurses;    // 주간 간호사 수
// 			private final int eveningNurses; // 저녁 간호사 수
// 			private final int nightNurses;   // 야간 간호사 수
// 		}
// 	}
//
// 	@Getter
// 	@Builder
// 	private static class ShiftRequest {
// 		private final Long requestId;    // 추가된 필드
// 		private final Long nurseId;
// 		private final int day;
// 		private final char requestedShift;
// 		private final boolean isReinforced;  // 강화된 요청인지 여부
// 	}
// }
