package net.dutymate.api.domain.member.dto;

import java.util.Optional;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.enums.Provider;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class GoogleUserResponseDto {

	private String email;
	private String name;
	private String picture;

	// GoogleUser(DTO) -> Member Entity
	public Member toMember(String defaultProfileImage) {
		return Member.builder()
			.email(email)
			.password("GooglePassword123!!")
			.name(name)
			.profileImg(Optional.ofNullable(picture).orElse(defaultProfileImage))
			.provider(Provider.GOOGLE)
			.build();
	}
}
