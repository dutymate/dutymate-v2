package net.dutymate.api.domain.autoschedule.util;

import java.util.Map;

import org.springframework.stereotype.Component;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.wardmember.ShiftType;

@Component
public class FixScheduleGenerator {

	/**
	 * 중간(Mid) 근무 일정을 생성합니다. 주말은 휴무(O)로, 평일은 M으로 설정합니다.
	 *
	 * @param yearMonth 연월 정보
	 * @return 생성된 중간 근무 일정 문자열
	 */
	public String midShiftBuilder(YearMonth yearMonth) {
		StringBuilder schedule = new StringBuilder();
		int daysInMonth = yearMonth.daysInMonth();

		for (int day = 1; day <= daysInMonth; day++) {
			schedule.append(yearMonth.isWeekend(day) ? 'O' : 'M');
		}

		return schedule.toString();
	}

	/**
	 * 야간 근무 일정을 생성합니다 (기본 NNNOOO 패턴 사용).
	 * 이 메서드는 더 이상 직접 쓰이지 않지만 하위 호환성을 위해 유지합니다.
	 *
	 * @param daysInMonth 해당 월의 일수
	 * @param rotation 간호사의 로테이션 번호
	 * @param totalNurses 전체 야간 근무 간호사 수
	 * @param dailyNightCount 일별 야간 근무 인원 카운트 맵 (수정됨)
	 * @return 생성된 야간 근무 일정 문자열
	 */
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

	/**
	 * 이전 달 패턴을 고려하여 연속적인 야간 근무 일정을 생성합니다.
	 * 이 메서드는 더 이상 직접 쓰이지 않지만 하위 호환성을 위해 유지합니다.
	 *
	 * @param daysInMonth 해당 월의 일수
	 * @param prevPattern 이전 달 패턴 (null 또는 빈 문자열이면 기본 패턴 사용)
	 * @param dailyNightCount 일별 야간 근무 인원 카운트 맵 (수정됨)
	 * @return 생성된 야간 근무 일정 문자열
	 */
	public String generateContinuousNightSchedule(int daysInMonth, String prevPattern,
		Map<Integer, Integer> dailyNightCount) {
		StringBuilder schedule = new StringBuilder();

		// 기본 패턴: NNNOOO (3일 야간, 3일 휴무)
		String basePattern = "NNNOOO";
		int patternLength = basePattern.length();

		// 이전 달 패턴이 없는 경우 기본 패턴 사용
		if (prevPattern == null || prevPattern.isEmpty()) {
			for (int i = 0; i < daysInMonth; i++) {
				char shift = basePattern.charAt(i % patternLength);
				schedule.append(shift);
				if (shift == 'N') {
					dailyNightCount.merge(i + 1, 1, Integer::sum);
				}
			}
			return schedule.toString();
		}

		// 이전 달 마지막 패턴 분석
		// 전체 패턴에서 현재 위치 찾기
		int patternPosition = -1;

		// 마지막 4글자 패턴 분석
		String lastPattern = prevPattern.length() <= 4 ? prevPattern : prevPattern.substring(prevPattern.length() - 4);

		// 가능한 모든 패턴 포지션 검사
		for (int i = 0; i < patternLength; i++) {
			boolean matches = true;
			for (int j = 0; j < lastPattern.length(); j++) {
				int checkPos = (i + j) % patternLength;
				if (basePattern.charAt(checkPos) != lastPattern.charAt(j)) {
					matches = false;
					break;
				}
			}
			if (matches) {
				patternPosition = (i + lastPattern.length()) % patternLength;
				break;
			}
		}

		// 패턴 포지션을 찾지 못한 경우 (비정상 패턴)
		if (patternPosition == -1) {
			// 마지막 문자를 기준으로 간단하게 처리
			char lastChar = lastPattern.charAt(lastPattern.length() - 1);
			if (lastChar == 'N') {
				// N 다음은 N 또는 O
				if (lastPattern.endsWith("NNN")) {
					patternPosition = 3; // NNN 다음은 OOO
				} else if (lastPattern.endsWith("NN")) {
					patternPosition = 2; // NN 다음은 NOOO
				} else {
					patternPosition = 1; // N 다음은 NNOOO
				}
			} else { // O
				if (lastPattern.endsWith("OOO")) {
					patternPosition = 0; // OOO 다음은 NNN
				} else if (lastPattern.endsWith("OO")) {
					patternPosition = 5; // OO 다음은 ONNN
				} else {
					patternPosition = 4; // O 다음은 ONNN
				}
			}
		}

		// 찾은 포지션부터 새 패턴 생성
		for (int i = 0; i < daysInMonth; i++) {
			char shift = basePattern.charAt((patternPosition + i) % patternLength);
			schedule.append(shift);
			if (shift == 'N') {
				dailyNightCount.merge(i + 1, 1, Integer::sum);
			}
		}

		return schedule.toString();
	}
}