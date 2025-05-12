package net.dutymate.api.domain.group.dto;

import net.dutymate.api.domain.group.NurseGroup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupInviteSuccessResponseDto {
	private Long groupId;
	private String groupName;

	public static  GroupInviteSuccessResponseDto of(NurseGroup group) {
		return GroupInviteSuccessResponseDto.builder()
			.groupId(group.getGroupId())
			.groupName(group.getGroupName())
			.build();
	}
}
