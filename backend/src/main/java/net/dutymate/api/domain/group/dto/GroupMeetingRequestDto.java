package net.dutymate.api.domain.group.dto;

import java.util.List;

import lombok.Data;

@Data
public class GroupMeetingRequestDto {

	List<Long> groupMemberIds;
}
