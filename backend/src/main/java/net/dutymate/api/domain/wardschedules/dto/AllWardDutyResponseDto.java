package net.dutymate.api.domain.wardschedules.dto;

import java.util.List;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.wardmember.Role;

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
		private Role role;
		private Integer shiftFlags;    // role 필드 추가
		private Integer grade;  // grade 필드 추가

		public static AllNurseShift of(Long memberId, String name, String shifts, Role role, Integer shiftFlags,
			Integer grade) {
			return AllNurseShift.builder()
				.memberId(memberId)
				.name(name)
				.shifts(shifts)
				.role(role)
				.shiftFlags(shiftFlags)
				.grade(grade)
				.build();
		}
	}
}
