package net.dutymate.api.member.dto;

import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Provider;
import net.dutymate.api.enumclass.Role;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponseDto {

	private String token;
	private Long memberId;
	private String name;
	private Role role;
	private String profileImg;
	private Provider provider;
	private boolean existAdditionalInfo;
	private boolean existMyWard;
	private boolean sentWardCode;

	// Member Entity -> LoginResponseDto
	public static LoginResponseDto of(Member member, String token, boolean existAdditionalInfo, boolean existMyWard,
		boolean sentWardCode) {
		return LoginResponseDto.builder()
			.token(token)
			.memberId(member.getMemberId())
			.name(member.getName())
			.role(member.getRole())
			.profileImg(member.getProfileImg())
			.provider(member.getProvider())
			.existAdditionalInfo(existAdditionalInfo)
			.existMyWard(existMyWard)
			.sentWardCode(sentWardCode)
			.build();
	}
}
