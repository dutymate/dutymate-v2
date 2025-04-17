package net.dutymate.api.wardschedules.dto;

import net.dutymate.api.records.YearMonth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyDutyResponseDto {

	private Integer year;
	private Integer month;
	private String prevShifts;
	private String nextShifts;
	private String shifts;

	public static MyDutyResponseDto of(
		YearMonth yearMonth, String prevShifts, String nextShifts, String shifts) {
		return MyDutyResponseDto.builder()
			.year(yearMonth.year())
			.month(yearMonth.month())
			.prevShifts(prevShifts)
			.nextShifts(nextShifts)
			.shifts(shifts)
			.build();
	}
}
