package net.dutymate.api.wardschedules.dto;

import java.util.List;

import net.dutymate.api.entity.Request;
import net.dutymate.api.enumclass.RequestStatus;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.enumclass.Shift;
import net.dutymate.api.enumclass.ShiftType;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.wardschedules.collections.WardSchedule;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WardScheduleResponseDto {

	private String id;
	private Integer year;
	private Integer month;
	private Integer invalidCnt;

	private List<NurseShifts> duty;
	private List<Issue> issues;
	private List<History> histories;
	private List<RequestDto> requests;

	public static WardScheduleResponseDto of(
		String id, YearMonth yearMonth, Integer invalidCnt, List<NurseShifts> duty, List<Issue> issues,
		List<History> histories, List<RequestDto> requests) {
		return WardScheduleResponseDto.builder()
			.id(id)
			.year(yearMonth.year())
			.month(yearMonth.month())
			.invalidCnt(invalidCnt)
			.duty(duty)
			.issues(issues)
			.histories(histories)
			.requests(requests)
			.build();
	}

	@Data
	@Builder
	public static class NurseShifts {

		private Long memberId;
		private String name;
		private Role role;
		private String prevShifts;
		private String shifts;
		private ShiftType shiftType;
		private Integer grade;

		public static NurseShifts of(WardSchedule.NurseShift nurseShift) {
			return NurseShifts.builder()
				.memberId(nurseShift.getMemberId())
				.shifts(nurseShift.getShifts())
				.build();
		}
	}

	@Data
	@Builder
	public static class Issue {

		private Long memberId;
		private String name;
		private Integer startDate;
		private Integer endDate;
		private Shift endDateShift;
		private String message;

	}

	@Data
	@Builder
	public static class History {

		private Integer idx; // history가 속해 있는 idx 값
		private Long memberId;
		private String name;
		private Shift before;
		private Shift after;
		private Integer modifiedDay;
		private Boolean isAutoCreated;
	}

	@Data
	@Builder
	public static class RequestDto {

		private Long requestId;
		private Long memberId;
		private String name;
		private Integer date;
		private RequestStatus status;

		public static RequestDto of(Request request) {
			return RequestDto.builder()
				.requestId(request.getRequestId())
				.memberId(request.getWardMember().getMember().getMemberId())
				.name(request.getWardMember().getMember().getName())
				.date(request.getRequestDate().getDate())
				.status(request.getStatus())
				.build();
		}
	}
}
