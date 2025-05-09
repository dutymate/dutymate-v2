package net.dutymate.api.domain.group.dto;

import net.dutymate.api.domain.group.NurseGroup;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupCreateRequestDto {

	@Size(max = 30, message = "그룹 이름은 최대 30자 입니다.")
	String groupName;
	@Size(max = 100, message = "그룹 소개는 최대 100자 입니다.")
	String groupDescription;
	String groupImg;

	public NurseGroup toGroup() {
		return NurseGroup.builder()
			.groupName(groupName)
			.groupDescription(groupDescription)
			.groupImg(groupImg)
			.build();
	}
}
