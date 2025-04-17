package net.dutymate.api.ward.dto;

import java.util.List;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.enumclass.Gender;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.enumclass.ShiftType;
import net.dutymate.api.enumclass.SkillLevel;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WardInfoResponseDto {

	private String wardCode;
	private String wardName;
	private String hospitalName;
	private int nursesTotalCnt;
	private long enterWaitingCnt;
	private List<Nurse> nurses;

	public static WardInfoResponseDto of(Ward ward, List<WardMember> wardMemberList, long enterWaitingCnt) {
		List<Nurse> nurses = wardMemberList.stream()
			.map(Nurse::of)
			.toList();

		return WardInfoResponseDto.builder()
			.wardCode(ward.getWardCode())
			.wardName(ward.getWardName())
			.hospitalName(ward.getHospitalName())
			.nursesTotalCnt(nurses.size())
			.enterWaitingCnt(enterWaitingCnt)
			.nurses(nurses)
			.build();

	}

	@Data
	@Builder
	public static class Nurse {

		private Long memberId;
		private String name;
		private Gender gender;
		private Role role;
		private Integer grade;
		private ShiftType shift;
		private SkillLevel skillLevel;
		private String memo;
		private Boolean isSynced;
		private String profileImg;

		public static Nurse of(WardMember wardMember) {
			Member member = wardMember.getMember();
			return Nurse.builder()
				.memberId(member.getMemberId())
				.name(member.getName())
				.gender(member.getGender())
				.role(member.getRole())
				.grade(member.getGrade())
				.shift(wardMember.getShiftType())
				.skillLevel(wardMember.getSkillLevel())
				.memo(wardMember.getMemo())
				.isSynced(wardMember.getIsSynced())
				.profileImg(member.getProfileImg())
				.build();
		}
	}
}
