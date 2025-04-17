package net.dutymate.api.ward.dto;

import net.dutymate.api.entity.Rule;
import net.dutymate.api.entity.Ward;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WardRequestDto {

	@Size(max = 50, message = "병원 이름은 최대 50자입니다.")
	private String hospitalName;
	@Size(max = 20, message = "병동 이름은 최대 20자입니다.")
	private String wardName;

	public Ward toWard(String wardCode) {
		return Ward.builder()
			.wardCode(wardCode)
			.wardName(wardName)
			.hospitalName(hospitalName)
			.rule(Rule.builder().build())
			.build();
	}
}
