package net.dutymate.api.domain.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdditionalInfoRequestDto {

	private Integer grade;
	private String gender;
	private String role;
}
