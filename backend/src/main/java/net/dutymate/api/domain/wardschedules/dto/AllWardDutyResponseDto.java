package net.dutymate.api.domain.wardschedules.dto;

import java.util.List;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.wardmember.Role;
import net.dutymate.api.domain.wardmember.ShiftType;

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
		private ShiftType shiftType;    // role 필드 추가
		private Integer grade;  // grade 필드 추가

		public static AllNurseShift of(Long memberId, String name, String shifts, Role role, ShiftType shiftType, Integer grade) {
			return AllNurseShift.builder()
				.memberId(memberId)
				.name(name)
				.shifts(shifts)
				.role(role)
				.shiftType(shiftType)
				.grade(grade)
				.build();
		}
	}
}