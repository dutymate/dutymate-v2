package net.dutymate.api.domain.autoschedule.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReAutoScheduleRequestDto {

	private int year;
	private int month;
	private List<Long> requestIds;
}
