package net.dutymate.api.domain.group.dto;

import java.time.LocalDate;
import java.util.List;

import net.dutymate.api.domain.group.TimeSlotStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupMeetingResponseDto {

	private List<RecommendedDate> recommendedDateList;

	@Data
	@Builder
	public static class RecommendedDate {
		private LocalDate date;
		private Integer score;
		private TimeSlotMessage message;
		private List<MemberDutyDto> memberList;
	}

	@Data
	@Builder
	public static class MemberDutyDto {
		private Long memberId;
		private String name;
		private String duty;
	}

	@Data
	@Builder
	public static class TimeSlotMessage {
		private TimeSlotStatus lunch;
		private TimeSlotStatus dinner;
	}
}
