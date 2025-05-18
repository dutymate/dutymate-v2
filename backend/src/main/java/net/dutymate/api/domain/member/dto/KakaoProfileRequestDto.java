package net.dutymate.api.domain.member.dto;

import lombok.Data;

@Data
public class KakaoProfileRequestDto {
	private String email;
	private String nickname;
	private String profileImageUrl;
}
