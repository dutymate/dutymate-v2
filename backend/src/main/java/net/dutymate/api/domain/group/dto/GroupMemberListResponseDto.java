package net.dutymate.api.domain.group.dto;

import java.time.LocalDate;
import java.util.List;

import net.dutymate.api.domain.group.GroupMember;
import net.dutymate.api.domain.group.NurseGroup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupMemberListResponseDto {

	private Long groupId;
	private String groupName;
	private String groupDescription;
	private String groupImg;
	private Integer groupMemberCount;
	private List<MemberDto> memberList;

	public static GroupMemberListResponseDto of(NurseGroup group, List<GroupMember> sortedMembers) {
		return GroupMemberListResponseDto.builder()
			.groupId(group.getGroupId())
			.groupName(group.getGroupName())
			.groupDescription(group.getGroupDescription())
			.groupImg(group.getGroupImg())
			.groupMemberCount(sortedMembers.size())
			.memberList(sortedMembers.stream().map(MemberDto::of).toList())
			.build();
	}

	@Data
	@Builder
	public static class MemberDto {
		private Long memberId;
		private String name;
		private Boolean isLeader;
		private LocalDate createdAt;

		public static MemberDto of(GroupMember groupMember) {
			return MemberDto.builder()
				.memberId(groupMember.getMember().getMemberId())
				.name(groupMember.getMember().getName())
				.isLeader(groupMember.getIsLeader())
				.createdAt(groupMember.getCreatedAt().toLocalDateTime().toLocalDate())
				.build();
		}

	}
}
