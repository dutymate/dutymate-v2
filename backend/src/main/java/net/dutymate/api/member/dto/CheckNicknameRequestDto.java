package net.dutymate.api.member.dto;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckNicknameRequestDto {

	@Size(max = 20, message = "닉네임은 최대 20자입니다.")
	private String nickname;
}
