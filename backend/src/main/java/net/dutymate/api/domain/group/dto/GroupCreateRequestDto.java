package net.dutymate.api.domain.group.dto;

import net.dutymate.api.domain.group.Groups;

import lombok.Data;

@Data
public class GroupCreateRequestDto {

	String groupName;
	String groupDescription;
	String groupImg;

	public Groups toGroup() {
		return Groups.builder()
			.groupName(groupName)
			.groupDescription(groupDescription)
			.groupImg(groupImg)
			.build();
	}
}
