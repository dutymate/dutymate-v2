package net.dutymate.api.domain.member.dto;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.entity.WardMember;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MypageResponseDto {

	private String hospitalName;
	private String wardName;
	private String profileImg;
	private String email;
	private String name;
	private String nickname;
	private String gender;
	private Integer grade;

	public static MypageResponseDto of(WardMember wardMember, Member member) {
		return MypageResponseDto.builder()
			.hospitalName(wardMember.getWard().getHospitalName())
			.wardName(wardMember.getWard().getWardName())
			.profileImg(member.getProfileImg())
			.email(member.getEmail())
			.name(member.getName())
			.nickname(member.getNickname())
			.gender(String.valueOf(member.getGender()))
			.grade(member.getGrade())
			.build();
	}

}
