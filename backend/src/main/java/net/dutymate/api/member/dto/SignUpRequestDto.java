package net.dutymate.api.member.dto;

import org.mindrot.jbcrypt.BCrypt;

import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Provider;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignUpRequestDto {

	@Size(max = 45, message = "이메일은 최대 45자입니다.")
	@Email(message = "이메일 형식이 아닙니다.")
	private String email;
	private String password;
	private String passwordConfirm;
	@Size(max = 20, message = "이름은 최대 20자입니다.")
	private String name;

	public Member toMember(String defaultProfileImg) {
		return Member.builder()
			.email(email)
			.password(BCrypt.hashpw(password, BCrypt.gensalt()))
			.name(name)
			.provider(Provider.NONE)
			.profileImg(defaultProfileImg)
			.build();
	}

	public LoginRequestDto toLoginRequestDto() {
		return LoginRequestDto.builder()
			.email(email)
			.password(password)
			.build();
	}
}
