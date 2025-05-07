package net.dutymate.api.domain.member.dto;

import java.util.Optional;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.Provider;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class KakaoUserResponseDto {

	private Long id;
	private String connectedAt;
	private Properties properties;
	private KakaoAccount kakaoAccount;

	private static final Integer DEFAULT_AUTO_GEN_CNT = 1;

	@Data
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public static class Properties {

		private String nickname;
		private String profileImage;
		private String thumbnailImage;
	}

	@Data
	@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
	public static class KakaoAccount {

		private Boolean profileNicknameNeedsAgreement;
		private Boolean profileImageNeedsAgreement;
		private Profile profile;
		private Boolean hasEmail;
		private Boolean emailNeedsAgreement;
		private Boolean isEmailValid;
		private Boolean isEmailVerified;
		private String email;

		// KakaoAccount(DTO) -> Member Entity
		public Member toMember(String defaultProfileImageUrl) {
			return Member.builder()
				.email(email)
				.password("KakaoPassword123!!")
				.name(profile.getNickname())
				.profileImg(Optional.ofNullable(profile.getProfileImageUrl()).orElse(defaultProfileImageUrl))
				.provider(Provider.KAKAO)
				.isVerified(true)
				.autoGenCnt(DEFAULT_AUTO_GEN_CNT)
				.build();
		}

		@Data
		@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
		public static class Profile {

			private String nickname;
			private String thumbnailImageUrl;
			private String profileImageUrl;
			private Boolean isDefaultImage;
			private Boolean isDefaultNickname;
		}
	}
}
