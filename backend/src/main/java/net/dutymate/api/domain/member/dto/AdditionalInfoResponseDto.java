package net.dutymate.api.domain.member.dto;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.wardmember.Role;

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
