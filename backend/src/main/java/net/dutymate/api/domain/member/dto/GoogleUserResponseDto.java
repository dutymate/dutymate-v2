package net.dutymate.api.domain.member.dto;

import java.util.Optional;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.Provider;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class GoogleUserResponseDto {

	private String email;
	private String name;
	private String picture;

	private static final Integer DEFAULT_AUTO_GEN_CNT = 1;

	// GoogleUser(DTO) -> Member Entity
	public Member toMember(String defaultProfileImage) {
		return Member.builder()
			.email(email)
			.password("GooglePassword123!!")
			.name(name)
			.profileImg(Optional.ofNullable(picture).orElse(defaultProfileImage))
			.provider(Provider.GOOGLE)
			.isVerified(true)
			.autoGenCnt(DEFAULT_AUTO_GEN_CNT)
			.build();
	}
}
