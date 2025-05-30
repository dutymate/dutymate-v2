package net.dutymate.api.domain.common.utils;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.ApplicationContext;

import net.dutymate.api.domain.holiday.Holiday;
import net.dutymate.api.domain.holiday.repository.HolidayRepository;

public record YearMonth(Integer year, Integer month) {
	// ApplicationContext 설정 메서드
	private static ApplicationContext applicationContext;

	// 캐싱을 위한 변수들
	private static final Map<String, Map<Integer, String>> holidayCache = new HashMap<>();
	private static final Map<String, Map<Integer, Boolean>> weekendDaysCache = new HashMap<>();
	private static final Map<String, Map<Integer, Boolean>> pureWeekendDaysCache = new HashMap<>();

	public static void setApplicationContext(ApplicationContext context) {
		YearMonth.applicationContext = context;
	}

	// 레코드 생성 시 year 또는 month가 null이면 현재 날짜 기준으로 레코드가 생성
	public YearMonth(Integer year, Integer month) {
		if (year == null || month == null) {
			LocalDateTime now = LocalDateTime.now();
			this.year = now.getYear();
			this.month = now.getMonthValue();
		} else {
			this.year = year;
			this.month = month;
		}
	}

	public static YearMonth nowYearMonth() {
		LocalDateTime now = LocalDateTime.now();
		return new YearMonth(now.getYear(), now.getMonthValue());
	}

	public int daysInMonth() {
		return java.time.YearMonth.of(year, month).lengthOfMonth();
	}

	public String initializeShifts() {
		return "X".repeat(daysInMonth());
	}

	public YearMonth prevYearMonth() {
		int prevYear = (month == 1) ? year - 1 : year;
		int prevMonth = (month == 1) ? 12 : month - 1;
		return new YearMonth(prevYear, prevMonth);
	}

	public YearMonth nextYearMonth() {
		int nextYear = (month == 12) ? year + 1 : year;
		int nextMonth = (month == 12) ? 1 : month + 1;
		return new YearMonth(nextYear, nextMonth);
	}

	// 캐시 키 생성 메서드
	private String getCacheKey() {
		return year + "-" + month;
	}

	// 공휴일 정보 가져오기 (캐싱 적용)
	private Map<Integer, String> getHolidays() {
		String cacheKey = getCacheKey();

		// 캐시에 이미 있으면 캐시된 데이터 반환
		if (holidayCache.containsKey(cacheKey)) {
			return holidayCache.get(cacheKey);
		}

		// 스프링 컨텍스트가 설정되지 않은 경우 빈 맵 반환
		if (applicationContext == null) {
			return Map.of();
		}

		try {
			HolidayRepository holidayRepository = applicationContext.getBean(HolidayRepository.class);
			List<Holiday> holidays = holidayRepository.findHolidaysInMonth(year, month);

			Map<Integer, String> holidayMap = new HashMap<>();
			for (Holiday holiday : holidays) {
				holidayMap.put(holiday.getDay(), holiday.getName());
			}

			// 결과를 캐시에 저장
			holidayCache.put(cacheKey, holidayMap);
			return holidayMap;
		} catch (Exception e) {
			return Map.of();
		}
	}

	// 순수 주말 여부 판단 메서드 (토요일, 일요일만 체크) - 캐싱 적용
	public Map<Integer, Boolean> getPureWeekendDays() {
		String cacheKey = getCacheKey();

		// 캐시에 이미 있으면 캐시된 데이터 반환
		if (pureWeekendDaysCache.containsKey(cacheKey)) {
			return pureWeekendDaysCache.get(cacheKey);
		}

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

		// 결과를 캐시에 저장
		pureWeekendDaysCache.put(cacheKey, weekendMap);
		return weekendMap;
	}

	// 주말 또는 공휴일 여부 판단 메서드 (종합) - 캐싱 적용
	public Map<Integer, Boolean> getWeekendDays() {
		String cacheKey = getCacheKey();

		// 캐시에 이미 있으면 캐시된 데이터 반환
		if (weekendDaysCache.containsKey(cacheKey)) {
			return weekendDaysCache.get(cacheKey);
		}

		Map<Integer, Boolean> pureWeekendMap = getPureWeekendDays();
		Map<Integer, String> holidayMap = getHolidays();

		Map<Integer, Boolean> combinedMap = new HashMap<>(pureWeekendMap);

		// 공휴일도 '주말'로 간주하여 추가
		for (Integer day : holidayMap.keySet()) {
			combinedMap.put(day, true);
		}

		// 결과를 캐시에 저장
		weekendDaysCache.put(cacheKey, combinedMap);
		return combinedMap;
	}

	// 특정 일자가 주말 또는 공휴일인지 확인 (통합된 휴일 개념)
	public boolean isWeekend(int day) {
		return getWeekendDays().get(day);
	}

	// 평일 근무일수 계산 (주말과 공휴일 제외)
	public int weekDaysInMonth() {
		int weekDaysInMonth = 0;
		for (int day = 1; day <= daysInMonth(); day++) {
			if (!isWeekend(day)) { // isOff 대신 isWeekend 사용 (의미는 동일)
				weekDaysInMonth++;
			}
		}
		return weekDaysInMonth;
	}

	public LocalDate atEndOfMonth() {
		return LocalDate.of(year, month, 1).withDayOfMonth(daysInMonth());
	}

	public boolean isBefore(YearMonth other) {
		if (this.year < other.year) {
			return true;
		}
		return this.year.equals(other.year) && this.month < other.month;
	}

	public boolean isSameOrAfter(YearMonth other) {
		return !isBefore(other);
	}

	public LocalDate atDay(int day) {
		return java.time.YearMonth.of(year, month).atDay(day);
	}
}
