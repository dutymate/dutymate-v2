package net.dutymate.api.domain.ward.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftsComparisonResponseDto {

	private String enterMemberShifts;
	private String tempMemberShifts;

	public static ShiftsComparisonResponseDto of(String enterMemberShifts, String tempMemberShifts) {
		return ShiftsComparisonResponseDto.builder()
			.enterMemberShifts(enterMemberShifts)
			.tempMemberShifts(tempMemberShifts)
			.build();
	}
}
