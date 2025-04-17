package net.dutymate.api.ward.dto;

import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Gender;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TempNurseResponseDto {

	private Long memberId;
	private String profileImg;
	private String name;
	private Integer grade;
	private Gender gender;

	public static TempNurseResponseDto of(Member member) {
		return TempNurseResponseDto.builder()
			.memberId(member.getMemberId())
			.profileImg(member.getProfileImg())
			.name(member.getName())
			.grade(member.getGrade())
			.gender(member.getGender())
			.build();
	}
}
