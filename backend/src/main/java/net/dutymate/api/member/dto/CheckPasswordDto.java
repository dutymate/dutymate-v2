package net.dutymate.api.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckPasswordDto {

	private String currentPassword;
	private String newPassword;
	private String newPasswordConfirm;
}
