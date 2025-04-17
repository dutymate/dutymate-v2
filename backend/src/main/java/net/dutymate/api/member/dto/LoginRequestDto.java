package net.dutymate.api.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginRequestDto {

	@Size(max = 45, message = "이메일은 최대 45자입니다.")
	@Email(message = "이메일 형식이 아닙니다.")
	private String email;
	private String password;
}
