package net.dutymate.api.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdditionalInfoRequestDto {

	private Integer grade;
	private String gender;
	private String role;
}
