package net.dutymate.api.member.dto;

import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Role;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdditionalInfoResponseDto {

	private Role role;

	// Member Entity -> AdditionalInfoResponseDto
	public static AdditionalInfoResponseDto of(Member member) {
		return AdditionalInfoResponseDto.builder()
			.role(member.getRole())
			.build();
	}
}
