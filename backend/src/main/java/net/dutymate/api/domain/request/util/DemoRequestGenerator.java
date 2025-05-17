package net.dutymate.api.domain.request.util;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import net.dutymate.api.domain.autoschedule.Shift;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.wardmember.WardMember;

public class DemoRequestGenerator {
	// 데모 요청 관련 상수
	private static final int MIN_REQUESTS_PER_NURSE = 1;
	private static final int BASE_DAY_MULTIPLIER = 7;
	private static final int OFFSET_MULTIPLIER = 5;
	private static final Random random = new Random();

	// 데모 요청 메모 상수
	private static final String MEMO_VACATION = "휴가를 사용하고 싶습니다.";
	private static final String MEMO_MORNING_CHECKUP = "오전에 건강검진 예약이 있어서 요청드립니다.";
	private static final String MEMO_WEDDING = "친구 결혼식이 있어서 요청드립니다.";
	private static final String MEMO_AFTERNOON_HOSPITAL = "오후에 병원 예약이 있어서 요청드립니다.";
	private static final String MEMO_FAMILY_GATHERING = "가족 모임이 있어서 요청드립니다.";
	private static final String MEMO_PERSONAL_SCHEDULE = "개인 일정이 있어서 요청드립니다.";

	// 전역 카운터 변수
	private static int acceptedCount = 0;
	private static int deniedCount = 0;
	private static int holdCount = 0;
	private static int totalCount = 0;

	private static final int MAX_ACCEPTED = 13;
	private static final int MAX_DENIED = 4;
	private static final int MAX_HOLD = 3;

	public static List<Request> generateRequests(WardMember wardMember, int nurseSeq, YearMonth yearMonth) {
		List<Request> requests = new ArrayList<>();
		int requestCount = (nurseSeq % 2) + MIN_REQUESTS_PER_NURSE;
		Set<Integer> selectedDays = new HashSet<>();

		for (int i = 0; i < requestCount; i++) {
			RequestInfo requestInfo = getRequestInfo(nurseSeq, i);
			int day = calculateRequestDay(nurseSeq, i, selectedDays, yearMonth);

			// 요청 상태 결정
			RequestStatus status = getRandomizedRequestStatus();

			Request request = createRequest(wardMember, requestInfo, day, yearMonth, status);
			requests.add(request);
		}

		return requests;
	}

	// 카운터 초기화
	public static void resetRequestCounters() {
		acceptedCount = 0;
		deniedCount = 0;
		holdCount = 0;
		totalCount = 0;
	}

	// 무작위로 요청 상태를 결정하는 메서드 (13:4:3 비율 유지)
	private static RequestStatus getRandomizedRequestStatus() {
		// 전체 20개 중 각 비율에 따른 최대 개수

		totalCount++;

		// 이미 20개를 넘어선 경우, 비율에 맞게 무작위로 선택
		if (totalCount > 20) {
			int randomChoice = random.nextInt(20);
			if (randomChoice < 13) {
				return RequestStatus.ACCEPTED;
			} else if (randomChoice < 17) {
				return RequestStatus.DENIED;
			} else {
				return RequestStatus.HOLD;
			}
		}

		// 할당 가능한 상태 목록 작성
		List<RequestStatus> availableStatuses = new ArrayList<>();

		if (acceptedCount < MAX_ACCEPTED) {
			availableStatuses.add(RequestStatus.ACCEPTED);
		}
		if (deniedCount < MAX_DENIED) {
			availableStatuses.add(RequestStatus.DENIED);
		}
		if (holdCount < MAX_HOLD) {
			availableStatuses.add(RequestStatus.HOLD);
		}

		// 남은 상태가 하나라면 그것을 선택
		if (availableStatuses.size() == 1) {
			RequestStatus status = availableStatuses.get(0);
			incrementCounter(status);
			return status;
		}

		// 랜덤하게 상태 선택 (가중치 적용)
		int randomValue = random.nextInt(100);
		RequestStatus selectedStatus;

		if (availableStatuses.contains(RequestStatus.ACCEPTED)
			&& (randomValue < getAcceptedWeight()
			|| availableStatuses.size() == 2
			&& !availableStatuses.contains(
			RequestStatus.DENIED))) {
			selectedStatus = RequestStatus.ACCEPTED;
		} else if (availableStatuses.contains(RequestStatus.DENIED)
			&& (randomValue < getAcceptedWeight() + getDeniedWeight() || !availableStatuses.contains(
			RequestStatus.HOLD))) {
			selectedStatus = RequestStatus.DENIED;
		} else {
			selectedStatus = RequestStatus.HOLD;
		}

		incrementCounter(selectedStatus);
		return selectedStatus;
	}

	// 가중치 계산 - 남은 할당량에 비례하여 가중치 부여
	private static int getAcceptedWeight() {
		return (13 - acceptedCount) * 5;
	}

	private static int getDeniedWeight() {
		return (4 - deniedCount) * 5;
	}

	// 카운터 증가
	private static void incrementCounter(RequestStatus status) {
		switch (status) {
			case ACCEPTED:
				acceptedCount++;
				break;
			case DENIED:
				deniedCount++;
				break;
			case HOLD:
				holdCount++;
				break;
		}
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
		int lastDayOfMonth = yearMonth.daysInMonth();

		int baseDay = (nurseSeq * BASE_DAY_MULTIPLIER) % lastDayOfMonth;
		int offset = (requestIndex * OFFSET_MULTIPLIER) % lastDayOfMonth;
		int day = (baseDay + offset) % lastDayOfMonth + 1;

		while (selectedDays.contains(day)) {
			day = (day % lastDayOfMonth) + 1;
		}
		selectedDays.add(day);

		return day;
	}

	private static Request createRequest(WardMember wardMember, RequestInfo requestInfo, int day, YearMonth yearMonth,
		RequestStatus status) {
		java.util.Calendar calendar = java.util.Calendar.getInstance();
		calendar.set(yearMonth.year(), yearMonth.month() - 1, day);

		// 날짜 유효성 검사
		if (day > yearMonth.daysInMonth()) {
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
			.status(status)
			.build();
	}
}
