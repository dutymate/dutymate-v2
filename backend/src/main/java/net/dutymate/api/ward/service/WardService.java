package net.dutymate.api.ward.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.EnterWaiting;
import net.dutymate.api.entity.Hospital;
import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.enumclass.Gender;
import net.dutymate.api.enumclass.Provider;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.member.repository.MemberRepository;
import net.dutymate.api.member.service.MemberService;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.ward.dto.AddNurseCntRequestDto;
import net.dutymate.api.ward.dto.EnterWaitingResponseDto;
import net.dutymate.api.ward.dto.HospitalNameResponseDto;
import net.dutymate.api.ward.dto.TempLinkRequestDto;
import net.dutymate.api.ward.dto.TempNurseResponseDto;
import net.dutymate.api.ward.dto.VirtualEditRequestDto;
import net.dutymate.api.ward.dto.WardInfoResponseDto;
import net.dutymate.api.ward.dto.WardRequestDto;
import net.dutymate.api.ward.repository.EnterWaitingRepository;
import net.dutymate.api.ward.repository.HospitalRepository;
import net.dutymate.api.ward.repository.WardRepository;
import net.dutymate.api.wardmember.repository.WardMemberRepository;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;
import net.dutymate.api.wardschedules.service.WardScheduleService;
import net.dutymate.api.wardschedules.util.InitialDutyGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WardService {

	private final WardRepository wardRepository;
	private final WardMemberRepository wardMemberRepository;
	private final WardScheduleRepository wardScheduleRepository;
	private final InitialDutyGenerator initialDutyGenerator;
	private final MemberRepository memberRepository;
	private final EnterWaitingRepository enterWaitingRepository;
	private final HospitalRepository hospitalRepository;
	private final WardScheduleService wardScheduleService;
	private final MemberService memberService;

	@Transactional
	public void createWard(WardRequestDto requestWardDto, Member member) {
		// 1. 로그인한 member가 이미 병동을 생성했다면, 400(BAD_REQUEST)
		boolean exists = wardMemberRepository.existsByMember(member);

		if (exists) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 병동이 있습니다.");
		}

		// 2. Ward  생성 -> Rule 자동 생성
		Ward ward = requestWardDto.toWard(generateWardCode());
		wardRepository.save(ward);

		// 3. WardMember 생성 (로그인한 사용자 추가)
		WardMember wardMember = WardMember.builder()
			.isSynced(true)
			.ward(ward)
			.member(member)
			.build();
		wardMemberRepository.save(wardMember);

		// ward의 List에 wardMember 추가
		ward.addWardMember(wardMember);

		// 4. 현재 날짜 기준으로  year, month 생성
		YearMonth yearMonth = YearMonth.nowYearMonth();

		// 5. 병동 생성하는 멤버의 듀티표 초기화하여 mongodb에 저장하기
		initialDutyGenerator.initializedDuty(wardMember, yearMonth);
	}

	@Transactional
	public void addToEnterWaiting(String wardCode, Member member) {
		// 0. 이미 입장 대기중인 병동이 있는지 확인
		if (enterWaitingRepository.existsByMember(member)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 입장 대기중인 병동이 있습니다.");
		}

		// 1. wardCode에 해당하는 ward가 존재하는지 확인
		Ward ward = wardRepository.findByWardCode(wardCode)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 병동 코드입니다."));

		// 2. 이미 ward에 입장한 회원인지 확인
		boolean isAlreadyEnteredWard = wardMemberRepository.existsByMember(member);
		if (isAlreadyEnteredWard) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 입장한 병동이 있습니다.");
		}

		// 3. 입장 대기 엔티티 생성 및 저장
		EnterWaiting enterWaiting = EnterWaiting.builder()
			.member(member)
			.ward(ward)
			.build();
		enterWaitingRepository.save(enterWaiting);
	}

	@Transactional
	public void enterDenied(Long enterMemberId, Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 수간호사가 속한 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 입장 요청한 멤버 정보 불러오기
		Member enterMember = memberRepository.findById(enterMemberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청한 회원 정보를 찾을 수 없습니다."));

		// 입장 대기 테이블에 없는 경우 예외 처리
		if (!enterWaitingRepository.existsByMemberAndWard(enterMember, ward)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청하지 않은 회원입니다.");
		}

		// 병동 입장을 승인한 경우
		// if (enterStatus.equals(EnterStatus.ACCEPTED)) {
		// 	enterToWard(ward, enterMember);
		// }

		// 병동 입장을 승인 or 거절하는 경우 모두 입장 대기 테이블에서 삭제시켜야 함
		enterWaitingRepository.removeByMemberAndWard(enterMember, ward);
	}

	@Transactional
	public void enterAcceptWithoutLink(Long enterMemberId, Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 수간호사가 속한 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 입장 요청한 멤버 정보 불러오기
		Member enterMember = memberRepository.findById(enterMemberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청한 회원 정보를 찾을 수 없습니다."));

		// 입장 대기 테이블에 없는 경우 예외 처리
		if (!enterWaitingRepository.existsByMemberAndWard(enterMember, ward)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청하지 않은 회원입니다.");
		}

		enterToWard(ward, enterMember);

		// 병동 입장을 승인 or 거절하는 경우 모두 입장 대기 테이블에서 삭제시켜야 함
		enterWaitingRepository.removeByMemberAndWard(enterMember, ward);
	}

	@Transactional
	public void enterAcceptWithLink(Long enterMemberId, TempLinkRequestDto tempLinkRequestDto, Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 수간호사가 속한 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 입장 요청한 멤버 정보 불러오기
		Member enterMember = memberRepository.findById(enterMemberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청한 회원 정보를 찾을 수 없습니다."));

		// 입장 대기 테이블에 없는 경우 예외 처리
		if (!enterWaitingRepository.existsByMemberAndWard(enterMember, ward)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입장 요청하지 않은 회원입니다.");
		}

		Member linkedTempMember = memberRepository.findById(tempLinkRequestDto.getTempMemberId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "임시 간호사를 찾을 수 없습니다."));

		// 임시 멤버 정보를 입장 멤버로 변경
		linkedTempMember.linkMember(enterMember);
		linkedTempMember.getWardMember().changeIsSynced(true);

		// 병동 입장을 승인 or 거절하는 경우 모두 입장 대기 테이블에서 삭제시켜야 함
		enterWaitingRepository.removeByMemberAndWard(enterMember, ward);

		// 입장한 멤버는 테이블에서 삭제
		memberRepository.delete(enterMember);
	}

	public void enterToWard(Ward ward, Member member) {
		// 1. wardCode에 해당하는 ward가 존재하는지 확인
		// Ward ward = wardRepository.findByWardCode(wardCode)
		// 	.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 병동 코드입니다."));

		// 2. 이미 ward에 입장한 회원인지 확인
		boolean isAlreadyEnteredWard = wardMemberRepository.existsByMember(member);
		if (isAlreadyEnteredWard) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 입장한 병동이 있습니다.");
		}

		// 3. 유효한 코드라면, 병동 회원으로 추가하기
		WardMember newWardMember = WardMember.builder()
			.isSynced(true)
			.ward(ward)
			.member(member)
			.build();

		wardMemberRepository.save(newWardMember);
		ward.addWardMember(newWardMember);

		// 4. 병동 Id로 MongoDB에 추가된 현재달과 다음달 듀티 확인
		// 4-1. 이번달 듀티
		YearMonth yearMonth = YearMonth.nowYearMonth();

		WardSchedule currMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			ward.getWardId(), yearMonth.year(), yearMonth.month()).orElse(null);

		// 4-2. 다음달 듀티
		YearMonth nextYearMonth = yearMonth.nextYearMonth();

		WardSchedule nextMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			ward.getWardId(), nextYearMonth.year(), nextYearMonth.month()).orElse(null);

		// 5. 기존 스케줄이 존재한다면, 새로운 스냅샷 생성 및 초기화된 duty 추가하기
		if (currMonthSchedule != null) {
			currMonthSchedule = initialDutyGenerator.updateDutyWithNewMember(currMonthSchedule, newWardMember);
			wardScheduleRepository.save(currMonthSchedule);
		}

		if (nextMonthSchedule != null) {
			nextMonthSchedule = initialDutyGenerator.updateDutyWithNewMember(nextMonthSchedule, newWardMember);
			wardScheduleRepository.save(nextMonthSchedule);
		}

		// 6. 기존 스케줄이 없다면, 입장한 멤버의 듀티표 초기화하여 저장하기
		// 사실 이미 병동이 생성된 이상, 무조건 기존 스케줄이 있어야만 함
		// if (currMonthSchedule == null && nextMonthSchedule == null) {
		// 	initialDutyGenerator.initializedDuty(newWardMember, yearMonth);
		// }
	}

	@Transactional
	public WardInfoResponseDto getWardInfo(Member member) {
		// 1. 현재 member(관리자)의 wardmemberId 조회
		WardMember wardMember = wardMemberRepository.findByMember(member);

		if (wardMember == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 멤버가 속한 병동을 찾을 수 없습니다.");
		}

		// 2. 관리자가 속한 병동 조회
		Ward ward = wardMember.getWard();

		// 3. 해당 병동의 모든 wardMember 조회
		List<WardMember> wardMemberList = wardMemberRepository.findAllByWard(ward);

		// 4. 입장 대기 인원 조회
		long enterWaitingCnt = enterWaitingRepository.countByWard(ward);

		return WardInfoResponseDto.of(ward, wardMemberList, enterWaitingCnt);
	}

	@Transactional(readOnly = true)
	public List<EnterWaitingResponseDto> getEnterWaitingList(Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 수간호사가 속한 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// EnterWaiting -> DTO 변환 후 반환
		return enterWaitingRepository.findByWard(ward)
			.stream()
			.map(EnterWaitingResponseDto::of)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<TempNurseResponseDto> getTempNuserList(Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 수간호사가 속한 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		return ward.getWardMemberList().stream()
			.filter(wardMember -> !wardMember.getIsSynced())
			.map(WardMember::getMember)
			.map(TempNurseResponseDto::of)
			.toList();
	}

	@Transactional
	public void addVirtualMember(AddNurseCntRequestDto addNurseCntRequestDto, Member member) {
		int addNurseCnt = addNurseCntRequestDto.getVirtualNurseCnt();

		// 1. 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 2. 병동 불러오기
		Ward ward = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 3. 새로운 임시간호사와 WardMember 만들기
		List<Member> newMemberList = new ArrayList<>();
		List<WardMember> newWardMemberList = new ArrayList<>();

		Integer tempNurseSeq = ward.getTempNurseSeq();
		String defaultProfileImgUrl = memberService.addBasicProfileImgUrl();

		for (int newNurse = 0; newNurse < addNurseCnt; newNurse++) {

			String virtualNurseName = "간호사" + (++tempNurseSeq);

			// 4. 병동 회원으로 가상 간호사 추가하기
			Member virtualMember = Member.builder()
				.email("tempEmail@temp.com")
				.name(virtualNurseName)
				.password("tempPassword123!!")
				.grade(1)
				.role(Role.RN)
				.gender(Gender.F)
				.provider(Provider.NONE)
				.profileImg(defaultProfileImgUrl)
				.build();
			newMemberList.add(virtualMember);
		}
		ward.changeTempNurseSeq(tempNurseSeq);
		memberRepository.saveAll(newMemberList);

		for (Member virtualMember : newMemberList) {
			// 새로운 병동 멤버로 추가
			WardMember virtualNurse = WardMember.builder()
				.isSynced(false)
				.ward(ward)
				.member(virtualMember)
				.build();
			// wardMemberRepository.save(virtualNurse);
			newWardMemberList.add(virtualNurse);
			ward.addWardMember(virtualNurse);
		}

		// RDB에 한 번에 저장
		wardMemberRepository.saveAll(newWardMemberList);

		// MongoDB 저장 (JPA 트랜잭션과 분리)
		wardScheduleService.updateWardSchedules(ward.getWardId(), newWardMemberList);
	}

	// wardCode : 랜덤한 6자리 대문자 + 숫자 조합 코드 생성
	private String generateWardCode() {
		Random random = new Random();
		StringBuilder code = new StringBuilder();
		String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		int wardCodeLength = 6;
		while (wardCodeLength-- > 0) {
			code.append(characters.charAt(random.nextInt(characters.length())));
		}
		return code.toString();
	}

	private String generateTempName(Ward ward, int index) {
		// 기존 Ward에 임시간호사 목록 조회
		List<WardMember> tempNurses = wardMemberRepository.findByWardAndIsSynced(ward, false);

		return "간호사" + (tempNurses.size() + index);
	}

	@Transactional
	public void changeVirtualMember(
		Long changeMemberId, VirtualEditRequestDto virtualEditRequestDto, Member member) {
		// 수간호사가 아니면 예외 처리
		if (!member.getRole().equals(Role.HN)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자가 아닙니다.");
		}

		// 이름 변경할 가상 간호사 불러오기
		Member changeMember = memberRepository.findById(changeMemberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 멤버입니다."));

		// 수간호사와 가상간호사가 같은 병동에 속한지 확인하기
		if (changeMember.getWardMember() != null && member.getWardMember() != null
			&& changeMember.getWardMember().getWard() != member.getWardMember().getWard()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "같은 병동에 속하지 않은 간호사입니다.");
		}

		// 정보 수정
		changeMember.changeTempMember(
			virtualEditRequestDto.getName(), virtualEditRequestDto.getGender(), virtualEditRequestDto.getGrade());
	}

	public List<HospitalNameResponseDto> findHospitalName(String query) {
		List<Hospital> hospitalList = hospitalRepository.findByHospitalNameContaining(query, PageRequest.of(0, 5));

		return hospitalList.stream().map(HospitalNameResponseDto::of).toList();

	}
}
