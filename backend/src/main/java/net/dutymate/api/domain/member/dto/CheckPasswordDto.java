package net.dutymate.api.domain.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckPasswordDto {

	private String currentPassword;
	private String newPassword;
	private String newPasswordConfirm;
}
