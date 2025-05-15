package net.dutymate.api.domain.group.dto;

import java.time.LocalDate;
import java.util.List;

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
		private String message;
		private List<MemberDutyDto> memberList;
	}

	@Data
	@Builder
	public static class MemberDutyDto {
		private Long memberId;
		private String name;
		private String duty;
	}
}
