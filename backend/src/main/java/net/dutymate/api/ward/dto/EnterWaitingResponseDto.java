package net.dutymate.api.ward.dto;

import net.dutymate.api.entity.EnterWaiting;
import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Gender;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EnterWaitingResponseDto {

	private Long memberId;
	private Integer grade;
	private Gender gender;
	private String name;

	public static EnterWaitingResponseDto of(EnterWaiting enterWaiting) {
		Member member = enterWaiting.getMember();
		return EnterWaitingResponseDto.builder()
			.memberId(member.getMemberId())
			.grade(member.getGrade())
			.gender(member.getGender())
			.name(member.getName())
			.build();
	}
}
