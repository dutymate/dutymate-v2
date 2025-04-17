package net.dutymate.api.wardmember.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.member.repository.MemberRepository;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.wardmember.dto.NurseInfoRequestDto;
import net.dutymate.api.wardmember.repository.WardMemberRepository;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;
import net.dutymate.api.wardschedules.util.InitialDutyGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WardMemberService {

	private final MemberRepository memberRepository;
	private final WardScheduleRepository wardScheduleRepository;
	private final WardMemberRepository wardMemberRepository;
	private final InitialDutyGenerator initialDutyGenerator;

	@Transactional
	public void updateWardMember(Long memberId, NurseInfoRequestDto nurseInfoRequestDto, Member authMember) {

		// memberId로 Member 찾기
		Member member = memberRepository.findById(memberId).orElseThrow(() -> new ResponseStatusException(
			HttpStatus.BAD_REQUEST, "유효하지 않은 memberId 입니다."));

		// member가 병동 회원인지 체크하는 로직
		validateWardMember(member, authMember);

		if (member.getRole() == Role.HN && nurseInfoRequestDto.getRole().equals("RN")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자는 간호사로 변경이 불가합니다.");
		}

		// 멤버와 1:1 매핑 되어 있는 wardMember 정보 수정
		member.getWardMember().updateWardMemberInfo(
			nurseInfoRequestDto.getShift(),
			nurseInfoRequestDto.getSkillLevel(),
			nurseInfoRequestDto.getMemo(),
			nurseInfoRequestDto.getRole()
		);
	}

	@Transactional
	public void deleteWardMember(Long memberId, Member authMember) {

		// 내보내려는 멤버 찾기
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 memberId 입니다."));

		// member가 병동 회원인지 체크하는 로직
		validateWardMember(member, authMember);

		WardMember wardMemeber = member.getWardMember();
		Ward ward = wardMemeber.getWard();

		// RDB에서 wardMember 삭제하기
		ward.removeWardMember(wardMemeber); // 리스트에서 제거(연관관계 제거)

		// MongoDB 에서 내보내는 wardmember 찾아서 삭제 (이전 달은 상관 X)
		// 이번달 듀티에서 삭제
		YearMonth yearMonth = YearMonth.nowYearMonth();

		WardSchedule currMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(),
			yearMonth.year(), yearMonth.month()).orElse(null);

		if (currMonthSchedule != null) {
			deleteWardMemberDuty(currMonthSchedule, member);
		}

		// 다음달 듀티에서 삭제
		YearMonth nextYearMonth = yearMonth.nextYearMonth();
		WardSchedule nextMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(),
			nextYearMonth.year(), nextYearMonth.month()).orElse(null);

		if (nextMonthSchedule != null) {
			deleteWardMemberDuty(nextMonthSchedule, member);
		}
	}

	public void deleteWardMemberDuty(WardSchedule existingSchedule, Member member) {

		// 마지막 nowIdx가 가리키는 Duty 가져오기
		WardSchedule.Duty currDuty = existingSchedule.getDuties().get(existingSchedule.getNowIdx());

		WardSchedule.Duty newDuty = WardSchedule.Duty.builder()
			.idx(0)
			.duty(new ArrayList<>(currDuty.getDuty()))
			.history(initialDutyGenerator.createInitialHistory())
			.build();

		newDuty.getDuty().removeIf(nurseShift -> nurseShift.getMemberId().equals(member.getMemberId()));

		WardSchedule deletedSchedule = WardSchedule.builder()
			.id(existingSchedule.getId())
			.wardId(existingSchedule.getWardId())
			.year(existingSchedule.getYear())
			.month(existingSchedule.getMonth())
			.duties(new ArrayList<>(List.of(newDuty))) // 기존 duties 초기화 시키고, 나간 멤버가 삭제된 duty 하나만 남기기
			.build();

		wardScheduleRepository.save(deletedSchedule);
	}

	/**
	 * member가 관리자(authMember)가 속한 병동 회원인지 체크하는 로직
	 */
	private void validateWardMember(Member member, Member authMember) {
		WardMember authWardMember = authMember.getWardMember();
		Ward authWard = authWardMember.getWard();

		if (member.getWardMember().getWard() != authWard) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 회원이 아닙니다.");
		}
	}
}
