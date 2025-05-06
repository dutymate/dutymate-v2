package net.dutymate.api.domain.request.util;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import net.dutymate.api.domain.autoschedule.Shift;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.wardmember.WardMember;

public class DemoRequestGenerator {
	// 데모 요청 관련 상수
	private static final int MIN_REQUESTS_PER_NURSE = 4;
	private static final int MAX_REQUESTS_PER_NURSE = 4;
	private static final int BASE_DAY_MULTIPLIER = 7;
	private static final int OFFSET_MULTIPLIER = 5;

	// 데모 요청 메모 상수
	private static final String MEMO_VACATION = "휴가를 사용하고 싶습니다.";
	private static final String MEMO_MORNING_CHECKUP = "오전에 건강검진 예약이 있어서 요청드립니다.";
	private static final String MEMO_WEDDING = "친구 결혼식이 있어서 요청드립니다.";
	private static final String MEMO_AFTERNOON_HOSPITAL = "오후에 병원 예약이 있어서 요청드립니다.";
	private static final String MEMO_FAMILY_GATHERING = "가족 모임이 있어서 요청드립니다.";
	private static final String MEMO_PERSONAL_SCHEDULE = "개인 일정이 있어서 요청드립니다.";

	public static List<Request> generateRequests(WardMember wardMember, int nurseSeq, YearMonth yearMonth) {
		List<Request> requests = new java.util.ArrayList<>();
		int requestCount = (nurseSeq % 2) + MIN_REQUESTS_PER_NURSE;
		Set<Integer> selectedDays = new HashSet<>();

		for (int i = 0; i < requestCount; i++) {
			RequestInfo requestInfo = getRequestInfo(nurseSeq, i);
			int day = calculateRequestDay(nurseSeq, i, selectedDays, yearMonth);
			Request request = createRequest(wardMember, requestInfo, day, yearMonth);
			requests.add(request);
		}

		return requests;
	}

	private static class RequestInfo {
		final Shift shift;
		final String memo;

		RequestInfo(Shift shift, String memo) {
			this.shift = shift;
			this.memo = memo;
		}
	}

	private static RequestInfo getRequestInfo(int nurseSeq, int requestIndex) {
		if (nurseSeq % 2 == 0) { // 짝수 번호 간호사
			switch (requestIndex) {
				case 0:
					return new RequestInfo(Shift.O, MEMO_VACATION);
				case 1:
					return new RequestInfo(Shift.E, MEMO_MORNING_CHECKUP);
				case 2:
					return new RequestInfo(Shift.O, MEMO_WEDDING);
				default:
					return new RequestInfo(Shift.D, MEMO_AFTERNOON_HOSPITAL);
			}
		} else { // 홀수 번호 간호사
			switch (requestIndex) {
				case 0:
					return new RequestInfo(Shift.O, MEMO_FAMILY_GATHERING);
				case 1:
					return new RequestInfo(Shift.D, MEMO_AFTERNOON_HOSPITAL);
				case 2:
					return new RequestInfo(Shift.O, MEMO_PERSONAL_SCHEDULE);
				default:
					return new RequestInfo(Shift.E, MEMO_MORNING_CHECKUP);
			}
		}
	}

	private static int calculateRequestDay(int nurseSeq, int requestIndex, Set<Integer> selectedDays,
		YearMonth yearMonth) {
		int lastDayOfMonth = yearMonth.atEndOfMonth().getDayOfMonth();

		int baseDay = (nurseSeq * BASE_DAY_MULTIPLIER) % lastDayOfMonth;
		int offset = (requestIndex * OFFSET_MULTIPLIER) % lastDayOfMonth;
		int day = (baseDay + offset) % lastDayOfMonth + 1;

		while (selectedDays.contains(day)) {
			day = (day % lastDayOfMonth) + 1;
		}
		selectedDays.add(day);

		return day;
	}

	private static Request createRequest(WardMember wardMember, RequestInfo requestInfo, int day, YearMonth yearMonth) {
		java.util.Calendar calendar = java.util.Calendar.getInstance();
		calendar.set(yearMonth.year(), yearMonth.month() - 1, day);

		// 날짜 유효성 검사
		if (day > yearMonth.atEndOfMonth().getDayOfMonth()) {
			throw new IllegalStateException(
				String.format("Invalid day %d for year %d month %d",
					day, yearMonth.year(), yearMonth.month()));
		}

		return Request.builder()
			.wardMember(wardMember)
			.requestDate(new Date(calendar.getTimeInMillis()))
			.requestShift(requestInfo.shift)
			.createdAt(new Timestamp(System.currentTimeMillis()))
			.memo(requestInfo.memo)
			.status(RequestStatus.HOLD)
			.build();
	}
}
