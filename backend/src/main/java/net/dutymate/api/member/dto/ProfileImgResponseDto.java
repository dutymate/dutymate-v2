package net.dutymate.api.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileImgResponseDto {

	private String profileImg;

	public static ProfileImgResponseDto of(String profileImg) {
		return ProfileImgResponseDto.builder()
			.profileImg(profileImg)
			.build();
	}
}
