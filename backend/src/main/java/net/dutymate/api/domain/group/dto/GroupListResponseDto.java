package net.dutymate.api.domain.group.dto;

import net.dutymate.api.domain.group.NurseGroup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupListResponseDto {

	private Long groupId;
	private String groupName;
	private String groupDescription;
	private Integer memberCnt;
	private String groupImg;

	public static GroupListResponseDto of(NurseGroup group) {
		return GroupListResponseDto.builder()
			.groupId(group.getGroupId())
			.groupName(group.getGroupName())
			.groupDescription(group.getGroupDescription())
			.memberCnt(group.getGroupMemberList().size())
			.groupImg(group.getGroupImg())
			.build();
	}
}
