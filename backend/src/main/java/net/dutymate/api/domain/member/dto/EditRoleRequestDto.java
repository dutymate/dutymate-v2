package net.dutymate.api.domain.member.dto;

import net.dutymate.api.domain.wardmember.Role;

import lombok.Data;

@Data
public class EditRoleRequestDto {

	private Role role;
}
