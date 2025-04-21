package net.dutymate.api.domain.wardschedules.dto;

import lombok.Data;

@Data
public class EditDutyRequestDto {

	private Integer year;
	private Integer month;
	private History history;

	@Data
	public static class History {
		private Long memberId;
		private String name;
		private String before;
		private String after;
		private Integer modifiedDay;
		private Boolean isAutoCreated;
	}
}
