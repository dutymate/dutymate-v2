package net.dutymate.api.domain.wardschedules.dto;

import java.util.List;

import net.dutymate.api.domain.common.utils.YearMonth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AllWardDutyResponseDto {

	private String id;
	private Integer year;
	private Integer month;

	private List<AllNurseShift> duty;

	public static AllWardDutyResponseDto of(String id, YearMonth yearMonth, List<AllNurseShift> duty) {
		return AllWardDutyResponseDto.builder()
			.id(id)
			.year(yearMonth.year())
			.month(yearMonth.month())
			.duty(duty)
			.build();
	}

	@Data
	@Builder
	public static class AllNurseShift {

		private Long memberId;

		private String name;
		private String shifts;

		public static AllNurseShift of(Long memberId, String name, String shifts) {
			return AllNurseShift.builder()
				.memberId(memberId)
				.name(name)
				.shifts(shifts)
				.build();
		}

	}
}
