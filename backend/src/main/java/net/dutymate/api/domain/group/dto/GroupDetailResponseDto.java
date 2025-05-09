package net.dutymate.api.domain.group.dto;

import java.util.List;

import net.dutymate.api.domain.group.NurseGroup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupDetailResponseDto {

	private Long groupId;
	private String groupName;
	private String groupDescription;
	private List<ShiftDto> shifts;

	public static GroupDetailResponseDto of(NurseGroup group, List<ShiftDto> shiftDtoList) {
		return GroupDetailResponseDto.builder()
			.groupId(group.getGroupId())
			.groupName(group.getGroupName())
			.groupDescription(group.getGroupDescription())
			.shifts(shiftDtoList)
			.build();
	}

	@Data
	@Builder
	public static class ShiftDto {
		private String date;
		private List<MemberDto> memberList;
	}

	@Data
	@Builder
	public static class MemberDto {
		private Long memberId;
		private String name;
		private String duty;
	}
}
