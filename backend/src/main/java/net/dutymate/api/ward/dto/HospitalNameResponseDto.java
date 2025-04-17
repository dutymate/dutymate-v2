package net.dutymate.api.ward.dto;

import net.dutymate.api.entity.Hospital;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HospitalNameResponseDto {

	private String hospitalName;
	private String address;
	private String sido;

	public static HospitalNameResponseDto of(Hospital hospital) {
		return HospitalNameResponseDto.builder()
			.hospitalName(hospital.getHospitalName())
			.address(hospital.getAddress())
			.sido(hospital.getSido())
			.build();
	}
}
