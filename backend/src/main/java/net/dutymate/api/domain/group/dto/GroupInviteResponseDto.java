package net.dutymate.api.domain.group.dto;

import net.dutymate.api.domain.group.NurseGroup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupInviteResponseDto {
	private String inviteUrl;
	private String groupName;

	public static GroupInviteResponseDto from(String inviteLink, NurseGroup group) {
		return GroupInviteResponseDto.builder()
			.inviteUrl(inviteLink)
			.groupName(group.getGroupName())
			.build();
	}
}
