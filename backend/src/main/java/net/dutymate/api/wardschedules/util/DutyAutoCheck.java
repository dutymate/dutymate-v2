package net.dutymate.api.wardschedules.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.springframework.stereotype.Component;

import net.dutymate.api.enumclass.Shift;
import net.dutymate.api.member.service.MemberService;
import net.dutymate.api.rule.dto.RuleResponseDto;
import net.dutymate.api.rule.service.RuleService;
import net.dutymate.api.wardschedules.dto.WardScheduleResponseDto;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DutyAutoCheck {

	private final RuleService ruleService;
	private final MemberService memberService;
	private static final String[] SHIFTS = {"D", "E", "N"};
	private static final String NIGHT_SHIFT_VIOLATION_MESSAGE = "Night 근무 규칙을 위반했습니다.";
	private static final String MAX_SHIFT_VIOLATION_MESSAGE = "최대 근무일 규칙을 위반했습니다.";
	private static final String[] FORBIDDEN_PATTERNS = {"ND", "NE", "ED", "NOD"};

	public List<WardScheduleResponseDto.Issue> check(List<WardScheduleResponseDto.NurseShifts> nurseShiftsDto, int year,
		int month) {
		List<WardScheduleResponseDto.Issue> issues = new ArrayList<>();
		RuleResponseDto rule = ruleService.getRule(
			memberService.getMemberById(nurseShiftsDto.getFirst().getMemberId()));

		for (WardScheduleResponseDto.NurseShifts ns : nurseShiftsDto) {
			List<WardScheduleResponseDto.Issue> personalIssues = checkPersonalDuty(ns, rule);
			if (!personalIssues.isEmpty()) {
				issues.addAll(personalIssues);
			}
		}

		return issues;
	}

	private List<WardScheduleResponseDto.Issue> checkPersonalDuty(WardScheduleResponseDto.NurseShifts ns,
		RuleResponseDto rule) {

		List<WardScheduleResponseDto.Issue> result = new ArrayList<>();
		String shifts = ns.getPrevShifts().concat(ns.getShifts());
		String name = ns.getName();
		int prevShfitsDay = ns.getPrevShifts().length();
		Long memberId = ns.getMemberId();

		nightIssuesGenerator(memberId, name, prevShfitsDay, shifts, rule, result);
		maxShiftsIssuesGenerator(memberId, name, prevShfitsDay, shifts, rule, result);
		specificPatternIssuesGenerator(memberId, name, prevShfitsDay, shifts, result);
		return result;
	}

	private void nightIssuesGenerator(Long memberId, String name, int prevShiftsDay,
		String shifts, RuleResponseDto rule, List<WardScheduleResponseDto.Issue> issues) {

		// 월 경계에 걸친 야간 연속 근무 체크
		int consecutiveFromPrev = 0;
		int currentIndex = 0;

		// 이전 달의 마지막 야간 근무 카운트 (뒤에서부터)
		while (currentIndex < prevShiftsDay
			&& shifts.charAt(prevShiftsDay - 1 - currentIndex) == 'N') {
			consecutiveFromPrev++;
			currentIndex++;
		}

		// 현재 달의 첫 야간 근무 카운트
		currentIndex = prevShiftsDay;
		while (currentIndex < shifts.length() && shifts.charAt(currentIndex) == 'N') {
			consecutiveFromPrev++;
			currentIndex++;
		}

		// 월 경계에 걸친 야간 연속 근무 체크
		if (consecutiveFromPrev > 0 && (consecutiveFromPrev < rule.getMinN()
			|| consecutiveFromPrev > rule.getMaxN())) {

			// 현재 달에서의 연속 N 개수 계산
			int currentMonthNCount = 0;
			for (int i = prevShiftsDay; i < currentIndex; i++) {
				if (shifts.charAt(i) == 'N') {
					currentMonthNCount++;
				}
			}

			// endDate 계산: 현재 달의 N이 없으면 1, 있으면 N의 개수만큼
			int endDate = Math.max(1, currentMonthNCount);

			issues.add(WardScheduleResponseDto.Issue.builder()
				.memberId(memberId)
				.name(name)
				.startDate(1)  // 현재 달의 1일부터
				.endDate(endDate)  // 현재 달의 N 개수나 최소 1
				.endDateShift(Shift.N)
				.message(NIGHT_SHIFT_VIOLATION_MESSAGE)
				.build());
		}

		// 기존 현재 달 내의 야간 연속 근무 체크 로직은 유지
		int index = shifts.indexOf(Shift.N.getValue(), currentIndex);

		while (index != -1) {
			if (index == shifts.length() - 1) {
				return;
			}
			int nightCnt = 0;

			while (index + nightCnt < shifts.length()
				&& shifts.charAt(index + nightCnt) == 'N') {
				nightCnt++;
			}

			if (nightCnt < rule.getMinN() || nightCnt > rule.getMaxN()) {
				issues.add(WardScheduleResponseDto.Issue.builder()
					.memberId(memberId)
					.name(name)
					.startDate(index + 1 - prevShiftsDay)
					.endDate(index + nightCnt - prevShiftsDay)
					.endDateShift(Shift.N)
					.message(NIGHT_SHIFT_VIOLATION_MESSAGE)
					.build());
			}

			index = shifts.indexOf(Shift.N.getValue(), index + nightCnt);
		}
	}

	private void maxShiftsIssuesGenerator(Long memberId, String name, int prevShiftsDay,
		String shifts, RuleResponseDto rule, List<WardScheduleResponseDto.Issue> issues) {

		// 첫 번째 검사: 이전 달에서 이어지는 연속 근무 체크
		int consecutiveFromPrev = 0;
		int currentIndex = 0;

		// 이전 달의 마지막 근무들 카운트 (뒤에서부터)
		while (currentIndex < prevShiftsDay
			&& isWorkingShift(shifts.charAt(prevShiftsDay - 1 - currentIndex))) {
			consecutiveFromPrev++;
			currentIndex++;
		}

		// 현재 달의 첫 근무들 카운트
		currentIndex = prevShiftsDay;
		while (currentIndex < shifts.length()
			&& isWorkingShift(shifts.charAt(currentIndex))) {
			consecutiveFromPrev++;
			currentIndex++;
		}

		// 이전 달과 현재 달에 걸친 연속 근무 체크
		if (consecutiveFromPrev > rule.getMaxShift()) {
			issues.add(WardScheduleResponseDto.Issue.builder()
				.memberId(memberId)
				.name(name)
				.startDate(1)  // 현재 달의 1일부터
				.endDate(currentIndex - prevShiftsDay)  // 연속 근무가 끝나는 날까지
				.endDateShift(Shift.valueOf(String.valueOf(shifts.charAt(currentIndex - 1))))
				.message(MAX_SHIFT_VIOLATION_MESSAGE)
				.build());
		}

		// 나머지 현재 달의 연속 근무 체크
		while (currentIndex < shifts.length()) {
			// 근무(D,E,N) 시작점 찾기
			while (currentIndex < shifts.length()
				&& !isWorkingShift(shifts.charAt(currentIndex))) {
				currentIndex++;
			}

			if (currentIndex >= shifts.length()) {
				break;
			}

			int startIndex = currentIndex;
			int consecutiveShifts = 0;

			// 연속 근무일 계산 (O나 X가 나오면 연속성 끊김)
			while (currentIndex < shifts.length()
				&& isWorkingShift(shifts.charAt(currentIndex))) {
				consecutiveShifts++;
				currentIndex++;
			}

			// 최대 연속 근무일 초과 체크
			if (consecutiveShifts > rule.getMaxShift()) {
				issues.add(WardScheduleResponseDto.Issue.builder()
					.memberId(memberId)
					.name(name)
					.startDate(startIndex + 1 - prevShiftsDay)
					.endDate(currentIndex - prevShiftsDay)
					.endDateShift(Shift.valueOf(String.valueOf(shifts.charAt(currentIndex - 1))))
					.message(MAX_SHIFT_VIOLATION_MESSAGE)
					.build());
			}

			if (currentIndex == startIndex) {
				currentIndex++;
			}
		}
	}

	private boolean isWorkingShift(char shift) {
		return shift == 'D' || shift == 'E' || shift == 'N';
	}

	private void specificPatternIssuesGenerator(Long memberId, String name, int prevShiftsDay,
		String shifts, List<WardScheduleResponseDto.Issue> issues) {

		for (String pattern : FORBIDDEN_PATTERNS) {
			// 월 경계에 걸친 패턴 검사 (이전 달 마지막 + 현재 달 초반)
			if (prevShiftsDay >= pattern.length() - 1) {  // 이전 달에 충분한 일수가 있는 경우
				String boundaryShifts = shifts.substring(prevShiftsDay - (pattern.length() - 1),
					Math.min(prevShiftsDay + pattern.length(), shifts.length()));
				int boundaryIndex = boundaryShifts.indexOf(pattern);

				if (boundaryIndex != -1 && boundaryIndex < pattern.length()) {
					// 패턴이 월 경계에 걸쳐있는 경우
					int patternStartInPrevMonth = (pattern.length() - 1) - boundaryIndex;
					int daysInCurrentMonth = pattern.length() - patternStartInPrevMonth;

					// 현재 달에 포함된 패턴의 마지막 문자 위치 찾기
					int endDateOffset = 0;
					for (int i = 0; i < daysInCurrentMonth; i++) {
						char currentChar = pattern.charAt(patternStartInPrevMonth + i);
						if (currentChar != 'O') {  // O가 아닌 실제 근무가 있는 날짜
							endDateOffset = i + 1;
						}
					}

					issues.add(WardScheduleResponseDto.Issue.builder()
						.memberId(memberId)
						.name(name)
						.startDate(1)  // 현재 달 1일부터
						.endDate(endDateOffset)  // 실제 근무가 있는 마지막 날까지
						.endDateShift(Shift.valueOf(String.valueOf(pattern.charAt(pattern.length() - 1))))
						.message(pattern + "형태의 근무는 허용되지 않습니다.")
						.build());
				}
			}

			// 현재 달 내의 패턴 검사
			int index = shifts.indexOf(pattern, prevShiftsDay);

			while (index != -1) {
				int startDate = index + 1 - prevShiftsDay;
				int endDate = index + pattern.length() - prevShiftsDay;

				if (endDate <= shifts.length() - prevShiftsDay) {
					issues.add(WardScheduleResponseDto.Issue.builder()
						.memberId(memberId)
						.name(name)
						.startDate(startDate)
						.endDate(endDate)
						.endDateShift(Shift.valueOf(String.valueOf(pattern.charAt(pattern.length() - 1))))
						.message(pattern + "형태의 근무는 허용되지 않습니다.")
						.build());
				}

				index = shifts.indexOf(pattern, index + 1);
			}
		}
	}

	private Map<Integer, Boolean> getWeekendDays(int year, int month) {
		// 해당 월의 첫날 구하기
		LocalDate firstDay = LocalDate.of(year, month, 1);

		// 해당 월의 마지막 날 구하기
		LocalDate lastDay = firstDay.withDayOfMonth(
			firstDay.lengthOfMonth()
		);

		// 결과를 저장할 Map (날짜 -> 주말여부)
		Map<Integer, Boolean> weekendMap = new HashMap<>();

		// 첫날부터 마지막날까지 순회
		LocalDate currentDate = firstDay;
		while (!currentDate.isAfter(lastDay)) {
			DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
			boolean isWeekend = dayOfWeek == DayOfWeek.SATURDAY
				|| dayOfWeek == DayOfWeek.SUNDAY;

			weekendMap.put(currentDate.getDayOfMonth(), isWeekend);
			currentDate = currentDate.plusDays(1);
		}

		return weekendMap;
	}

	private int[][] wardInfo(int year, int month, List<WardScheduleResponseDto.NurseShifts> nurseShiftsDto) {

		//달의 일수 (30,31,28,29)
		LocalDate date = LocalDate.of(year, month, 1);
		int daysInMonth = date.lengthOfMonth();

		int[][] result = new int[5][daysInMonth + 1];

		IntStream.rangeClosed(1, daysInMonth)
			.forEach(day ->
				nurseShiftsDto.stream()
					.map(ns -> ns.getShifts().charAt(day - 1))
					.forEach(shift -> {
						switch (shift) {
							case 'D' -> result[Shift.D.ordinal()][day]++;
							case 'E' -> result[Shift.E.ordinal()][day]++;
							case 'N' -> result[Shift.N.ordinal()][day]++;
							case 'O' -> result[Shift.O.ordinal()][day]++;
							case 'X' -> result[Shift.X.ordinal()][day]++;
						}
					})
			);
		return result;
	}

	public List<String> generateAllCombinations(int maxShift) {
		List<String> result = new ArrayList<>();
		generateCombinations("", maxShift, result);
		return result;
	}

	private void generateCombinations(String current, int remaining, List<String> result) {
		// 기저 조건: 원하는 길이에 도달했을 때
		if (remaining == 0) {
			result.add(current);
			return;
		}

		for (String shift : SHIFTS) {
			generateCombinations(current + shift, remaining - 1, result);
		}
	}
}
