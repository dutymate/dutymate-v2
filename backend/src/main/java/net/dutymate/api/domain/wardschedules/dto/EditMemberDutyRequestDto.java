package net.dutymate.api.domain.wardschedules.dto;

import net.dutymate.api.domain.autoschedule.Shift;

import lombok.Data;

@Data
public class EditMemberDutyRequestDto {

	private Integer year;
	private Integer month;
	private Integer day;
	private Shift shift;
}
