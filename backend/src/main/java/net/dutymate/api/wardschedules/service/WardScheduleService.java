package net.dutymate.api.wardschedules.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.enumclass.RequestStatus;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.enumclass.Shift;
import net.dutymate.api.enumclass.ShiftType;
import net.dutymate.api.member.repository.MemberRepository;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.request.repository.RequestRepository;
import net.dutymate.api.request.util.UpdateRequestStatuses;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.dto.AllWardDutyResponseDto;
import net.dutymate.api.wardschedules.dto.EditDutyRequestDto;
import net.dutymate.api.wardschedules.dto.MyDutyResponseDto;
import net.dutymate.api.wardschedules.dto.TodayDutyResponseDto;
import net.dutymate.api.wardschedules.dto.WardScheduleResponseDto;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;
import net.dutymate.api.wardschedules.util.DutyAutoCheck;
import net.dutymate.api.wardschedules.util.InitialDutyGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WardScheduleService {

	private final MemberRepository memberRepository;
	private final WardScheduleRepository wardScheduleRepository;
	private final DutyAutoCheck dutyAutoCheck;
	private final InitialDutyGenerator initialDutyGenerator;
	private final UpdateRequestStatuses updateRequestStatuses;
	private final RequestRepository requestRepository;

	@Transactional
	public WardScheduleResponseDto getWardSchedule(Member member, final YearMonth yearMonth, Integer nowIdx) {

		// 조회하려는 달이 (현재 달 + 1달) 안에 포함되지 않는 경우 예외 처리
		if (!isInNextMonth(yearMonth)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "근무표는 최대 다음달 까지만 조회가 가능합니다.");
		}

		// 이전 연, 월 초기화
		YearMonth prevYearMonth = yearMonth.prevYearMonth();

		// 현재 속한 병동 정보 가져오기
		Ward ward = Optional.of(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 몽고 DB에서 병동 스케줄 가져오기
		WardSchedule wardSchedule =
			wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(), yearMonth.year(), yearMonth.month())
				.orElseGet(() -> initialDutyGenerator.createNewWardSchedule(ward, ward.getWardMemberList(), yearMonth));

		// 몽고 DB에서 전달 병동 스케줄 가져오기
		WardSchedule prevWardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(ward.getWardId(), prevYearMonth.year(), prevYearMonth.month())
			.orElse(null);

		if (nowIdx == null) {
			nowIdx = wardSchedule.getNowIdx();
		}

		// 이번달 듀티표 가져오기
		List<WardSchedule.NurseShift> recentNurseShifts = wardSchedule.getDuties().get(nowIdx).getDuty();
		// 전달 듀티표 가져오기
		List<WardSchedule.NurseShift> prevNurseShifts;
		if (prevWardSchedule != null) {
			prevNurseShifts = prevWardSchedule.getDuties().get(prevWardSchedule.getNowIdx()).getDuty();
		} else {
			prevNurseShifts = null;
		}

		wardSchedule.setNowIdx(nowIdx);

		wardScheduleRepository.save(wardSchedule);

		// recentNurseShifts -> DTO 변환
		List<WardScheduleResponseDto.NurseShifts> nurseShiftsDto = recentNurseShifts.stream()
			.map(WardScheduleResponseDto.NurseShifts::of)
			.toList();

		// DTO에 값 넣어주기
		nurseShiftsDto.forEach(now -> {
			Member nurse = memberRepository.findById(now.getMemberId())
				.orElseGet(() -> Member.builder().name("(탈퇴회원)").role(Role.RN).grade(1).build());
			// .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "간호사 매핑 오류"));
			now.setName(nurse.getName());
			now.setRole(nurse.getRole());
			now.setGrade(nurse.getGrade());
			now.setShiftType(nurse.getWardMember() == null ? ShiftType.ALL : nurse.getWardMember().getShiftType());

			// prevShifts 구하기 (기존 코드 유지)
			if (prevNurseShifts == null) {
				now.setPrevShifts("XXXX");
			} else {
				WardSchedule.NurseShift prevShifts = prevNurseShifts.stream()
					.filter(prev -> Objects.equals(prev.getMemberId(), nurse.getMemberId()))
					.findAny()
					.orElseGet(() -> WardSchedule.NurseShift.builder().shifts("XXXX").build());
				now.setPrevShifts(prevShifts.getShifts().substring(prevShifts.getShifts().length() - 4));
			}

		});

		// 정렬
		nurseShiftsDto = nurseShiftsDto.stream()
			.sorted(
				Comparator.comparing((WardScheduleResponseDto.NurseShifts nurse) -> nurse.getRole() != Role.HN)
					.thenComparing(nurse -> {
						ShiftType shift = nurse.getShiftType();
						if (shift == null) {
							return 2;
						}
						return switch (shift) {
							case D -> 0;    // D가 가장 위
							case ALL -> 1;  // ALL이 두 번째
							case N -> 3;    // N이 가장 아래
							case E -> 4;    // E는 N 다음
							default -> 2;   // 기타 케이스는 ALL과 N 사이
						};
					})
					.thenComparing(WardScheduleResponseDto.NurseShifts::getGrade,
						Comparator.nullsLast(Comparator.reverseOrder()))
			)
			.toList();

		// TODO invalidCnt 구하기
		// int invalidCnt = calcInvalidCnt(recentNurseShifts);

		// Issues 구하기
		List<WardScheduleResponseDto.Issue> issues =
			dutyAutoCheck.check(nurseShiftsDto, yearMonth.year(), yearMonth.month());

		// History 구하기
		List<WardScheduleResponseDto.History> histories = findHistory(wardSchedule.getDuties());

		// 승인, 대기 상태인 요청 구하기
		List<WardScheduleResponseDto.RequestDto> requests = null;

		return WardScheduleResponseDto.of(wardSchedule.getId(), yearMonth, 0, nurseShiftsDto, issues, histories,
			requests);
	}

	private List<WardScheduleResponseDto.RequestDto> findRequest(Ward ward) {
		return requestRepository.findAllWardRequests(ward)
			.stream()
			.filter(o -> o.getStatus() != RequestStatus.DENIED)
			.map(WardScheduleResponseDto.RequestDto::of)
			.toList();
	}

	private boolean isInNextMonth(YearMonth yearMonth) {
		int serverMonth = Integer.parseInt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM")));
		int inputMonth = Integer.parseInt(yearMonth.year() + String.format("%02d", yearMonth.month()));
		return inputMonth <= serverMonth + 1;
	}

	@Transactional
	public WardScheduleResponseDto editWardSchedule(Member member, List<EditDutyRequestDto> editDutyRequestDtoList) {
		// 연, 월, 수정일, 수정할 멤버 변수 초기화
		final YearMonth yearMonth =
			new YearMonth(editDutyRequestDtoList.getFirst().getYear(), editDutyRequestDtoList.getFirst().getMonth());

		// 병동멤버와 병동 초기화
		Ward ward = Optional.of(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."))
			.getWard();

		// 몽고 DB에서 이번달 병동 스케줄 불러오기
		WardSchedule wardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(ward.getWardId(), yearMonth.year(), yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "근무표가 생성되지 않았습니다."));

		// PUT 요청 : 히스토리로 nowIdx가 중간으로 돌아간 상황에서 수동 수정이 일어난 경우,
		List<WardSchedule.Duty> recentDuties = wardSchedule.getDuties();
		int nowIdx = wardSchedule.getNowIdx();

		// 히스토리 포인트로 돌아 갔을 때, 수정 요청이 들어오면, 히스토리 이후 데이터 날리기
		List<WardSchedule.Duty> duties = recentDuties.subList(0, nowIdx + 1); // nowIdx 이후 데이터 제거

		for (EditDutyRequestDto editDutyRequestDto : editDutyRequestDtoList) {
			final int modifiedIndex = editDutyRequestDto.getHistory().getModifiedDay() - 1;
			final Long modifiedMemberId = editDutyRequestDto.getHistory().getMemberId();

			// 가장 최근 스냅샷
			List<WardSchedule.NurseShift> recentDuty = duties.get(nowIdx).getDuty();

			// 새로 만들 스냅샷
			List<WardSchedule.NurseShift> newDuty = new ArrayList<>();

			// 가장 최근 스냅샷 -> 새로 만들 스냅샷 복사 (깊은 복사)
			recentDuty.forEach(nurseShift -> newDuty.add(WardSchedule.NurseShift.builder()
				.memberId(nurseShift.getMemberId())
				.shifts(nurseShift.getShifts())
				.build()));

			// 새로 만들 스냅샷에 수정사항 반영
			newDuty.stream()
				.filter(prev -> Objects.equals(prev.getMemberId(), modifiedMemberId))
				.forEach(prev -> {
					String before = prev.getShifts();
					String after = before.substring(0, modifiedIndex) + editDutyRequestDto.getHistory().getAfter()
						+ before.substring(modifiedIndex + 1);

					prev.changeShifts(after);
				});

			// 기존 병동 스케줄에 새로운 스냅샷 추가 및 저장
			duties.add(WardSchedule.Duty.builder()
				.idx(nowIdx + 1)
				.duty(newDuty)
				.history(WardSchedule.History.builder()
					.memberId(editDutyRequestDto.getHistory().getMemberId())
					.name(editDutyRequestDto.getHistory().getName())
					.before(editDutyRequestDto.getHistory().getBefore())
					.after(editDutyRequestDto.getHistory().getAfter())
					.modifiedDay(editDutyRequestDto.getHistory().getModifiedDay())
					.isAutoCreated(editDutyRequestDto.getHistory().getIsAutoCreated())
					.build())
				.build());

			nowIdx++;
		}

		/*WardSchedule updatedWardSchedule = WardSchedule.builder()
			.id(wardSchedule.getId())
			.wardId(wardSchedule.getWardId())
			.year(yearMonth.year())
			.month(yearMonth.month())
			.nowIdx(nowIdx)
			.duties(duties)
			.build();*/
		wardSchedule.setDuties(duties);
		wardSchedule.setNowIdx(nowIdx);
		wardScheduleRepository.save(wardSchedule);
		return getWardSchedule(member, yearMonth, nowIdx);
	}

	private List<WardScheduleResponseDto.History> findHistory(List<WardSchedule.Duty> duties) {
		List<WardScheduleResponseDto.History> histories = new ArrayList<>();

		for (WardSchedule.Duty duty : duties) {
			if (duty.getHistory().getMemberId() != 0) {
				histories.add(WardScheduleResponseDto.History.builder()
					.idx(duty.getIdx())
					.memberId(duty.getHistory().getMemberId())
					.name(duty.getHistory().getName())
					.before(Shift.valueOf(duty.getHistory().getBefore()))
					.after(Shift.valueOf(duty.getHistory().getAfter()))
					.modifiedDay(duty.getHistory().getModifiedDay())
					.isAutoCreated(duty.getHistory().getIsAutoCreated())
					.build());
			}
		}
		return histories;
	}

	@Transactional(readOnly = true)
	public MyDutyResponseDto getMyDuty(Member member, final YearMonth yearMonth) {
		// 병동멤버와 병동 초기화
		WardMember wardMember = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."));
		Ward ward = wardMember.getWard();

		// 이전 연, 월 초기화
		YearMonth prevYearMonth = yearMonth.prevYearMonth();

		// 다음 연, 월 초기화
		YearMonth nextYearMonth = yearMonth.nextYearMonth();

		// 현재 달의 일 수 계산 (28, 29, 30, 31일 중)
		int daysInMonth = yearMonth.daysInMonth();
		final int daysInAWeek = 7;

		// 현재 달, 이전 달, 다음 달 병동 스케줄 불러오기
		WardSchedule wardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(ward.getWardId(), yearMonth.year(), yearMonth.month()).orElse(null);
		WardSchedule prevWardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(ward.getWardId(), prevYearMonth.year(), prevYearMonth.month()).orElse(null);
		WardSchedule nextWardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(ward.getWardId(), nextYearMonth.year(), nextYearMonth.month()).orElse(null);

		// 듀티 기본값 초기화
		String shifts = "X".repeat(daysInMonth);
		String prevShifts = "X".repeat(daysInAWeek);
		String nextShifts = "X".repeat(daysInAWeek);

		// 3달치 병동 스케줄을 모두 확인. 병동 스케줄이 있으면 한달치, 일주일치 shifts 구하기
		if (wardSchedule != null) {
			shifts = getShifts(member, wardSchedule, daysInMonth);
		}

		if (prevWardSchedule != null) {
			prevShifts = getShifts(member, prevWardSchedule, daysInMonth)
				.substring(prevYearMonth.daysInMonth() - daysInAWeek);
		}

		if (nextWardSchedule != null) {
			nextShifts = getShifts(member, nextWardSchedule, daysInMonth)
				.substring(0, daysInAWeek);
		}

		return MyDutyResponseDto.of(yearMonth, prevShifts, nextShifts, shifts);
	}

	// 병동 스케줄에서 현재 로그인한 멤버의 듀티 구하기
	private static String getShifts(Member member, WardSchedule wardSchedule, int daysInMonth) {
		return wardSchedule.getDuties().getLast().getDuty().stream()
			.filter(o -> Objects.equals(o.getMemberId(), member.getMemberId()))
			.findAny()
			.orElseGet(() -> WardSchedule.NurseShift.builder().shifts("X".repeat(daysInMonth)).build())
			.getShifts();
	}

	@Transactional(readOnly = true)
	public TodayDutyResponseDto getTodayDuty(
		Member member, final Integer year, final Integer month, final Integer date) {

		// 병동멤버와 병동 불러오기
		WardMember wardMember = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."));
		Ward ward = wardMember.getWard();

		// 해당 월의 근무표 불러오기
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(), year, month)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "아직 해당 월의 근무표가 생성되지 않았습니다."));

		// 간호사 듀티 리스트 가져오기
		List<WardSchedule.NurseShift> nurseShifts = wardSchedule.getDuties().getLast().getDuty();

		// 나의 근무표 구하기
		WardSchedule.NurseShift myShift = nurseShifts.stream()
			.filter(o -> Objects.equals(o.getMemberId(), member.getMemberId()))
			.findAny()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "나의 근무를 찾을 수 없습니다."));

		// 다른 사람들의 근무표 리스트 구하고 DTO 변환
		List<TodayDutyResponseDto.GradeNameShift> otherShifts = nurseShifts.stream()
			.map(nurseShift -> {
				Member nurse = memberRepository.findById(nurseShift.getMemberId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "간호사 매핑 오류"));
				return TodayDutyResponseDto.GradeNameShift
					.of(nurse.getGrade(), nurse.getName(), nurseShift.getShifts().charAt(date - 1));
			})
			.sorted(Comparator.comparing(TodayDutyResponseDto.GradeNameShift::getShift))
			.toList();

		return TodayDutyResponseDto.of(myShift.getShifts().charAt(date - 1), otherShifts);
	}

	@Transactional(readOnly = true)
	public AllWardDutyResponseDto getAllWardDuty(Member member) {
		WardMember wardMember = member.getWardMember();

		// 1. 현재 연도와 월 가져오기
		YearMonth yearMonth = YearMonth.nowYearMonth();

		// 2. 병동 정보 조회
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
				wardMember.getWard().getWardId(), yearMonth.year(), yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 해당하는 듀티가 없습니다."));

		// 3. 가장 최신 duty 가져오기
		WardSchedule.Duty latestSchedule = wardSchedule.getDuties().getLast();

		// 4. NurseShift를 AllNurseShift로 변환
		List<AllWardDutyResponseDto.AllNurseShift> nurseShiftList = latestSchedule.getDuty().stream()
			.map(nurseShift -> {
				Member nurse = memberRepository.findById(nurseShift.getMemberId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 멤버 ID 입니다."));

				return AllWardDutyResponseDto.AllNurseShift.of(nurse.getMemberId(), nurse.getName(),
					nurseShift.getShifts());

			}).toList();

		return AllWardDutyResponseDto.of(wardSchedule.getId(), yearMonth, nurseShiftList);
	}

	public void resetWardSchedule(Member member, final YearMonth yearMonth) {
		// 병동멤버와 병동 불러오기
		WardMember wardMember = Optional.ofNullable(member.getWardMember())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속해있지 않은 회원입니다."));

		Ward ward = wardMember.getWard();

		// 해당 월의 근무표 불러오기
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(),
				yearMonth.year(), yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "아직 해당 월의 근무표가 생성되지 않았습니다."));

		// 모든 근무자의 듀티 기본값 초기화
		String emptyShifts = yearMonth.initializeShifts();

		// 초기화된 duty 추가
		List<WardSchedule.NurseShift> resetShift = ward.getWardMemberList()
			.stream()
			.map(nurse -> WardSchedule.NurseShift.builder()
				.memberId(nurse.getMember().getMemberId())
				.shifts(emptyShifts)
				.build())
			.toList();

		WardSchedule.Duty resetDuty = WardSchedule.Duty.builder()
			.idx(0)
			.duty(resetShift)
			.history(initialDutyGenerator.createInitialHistory())
			.build();

		wardSchedule.getDuties().clear();
		wardSchedule.getDuties().add(resetDuty);
		wardSchedule.setNowIdx(0);

		wardScheduleRepository.save(wardSchedule);
	}

	// 임시간호사 생성 시, mongo update
	public void updateWardSchedules(Long wardId, List<WardMember> newWardMemberList) {
		// 5. MongoDB 듀티표 업데이트
		// 이번달 듀티
		YearMonth yearMonth = YearMonth.nowYearMonth();

		WardSchedule currMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			wardId, yearMonth.year(), yearMonth.month()).orElse(null);

		// 다음달 듀티
		YearMonth nextYearMonth = yearMonth.nextYearMonth();
		WardSchedule nextMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			wardId, nextYearMonth.year(), nextYearMonth.month()).orElse(null);

		List<WardSchedule> updatedScheduleList = new ArrayList<>();

		// 기존 스케줄이 존재한다면, 새로운 스냅샷 생성 및 초기화된 duty 추가하기
		if (currMonthSchedule != null) {
			for (WardMember nurse : newWardMemberList) {
				currMonthSchedule = initialDutyGenerator.updateDutyWithNewMember(currMonthSchedule, nurse);
			}
			updatedScheduleList.add(currMonthSchedule);
		}

		if (nextMonthSchedule != null) {
			for (WardMember nurse : newWardMemberList) {
				nextMonthSchedule = initialDutyGenerator.updateDutyWithNewMember(nextMonthSchedule, nurse);
			}
			updatedScheduleList.add(nextMonthSchedule);
		}

		// 6. 기존 스케줄이 없다면, 입장한 멤버의 듀티표 초기화하여 저장하기
		// 사실 이미 병동이 생성된 이상, 무조건 기존 스케줄이 있어야만 함
		if (currMonthSchedule == null && nextMonthSchedule == null) {
			for (WardMember nurse : newWardMemberList) {
				updatedScheduleList.add(initialDutyGenerator.initializedDuty(nurse, yearMonth));
			}
		}

		// 7. MongoDB에 한 번만 접근하여 데이터 넣기
		if (!updatedScheduleList.isEmpty()) {
			for (WardSchedule schedule : updatedScheduleList) {

				WardSchedule existingSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(schedule.getWardId(),
					schedule.getYear(), schedule.getMonth()).orElse(null);

				if (existingSchedule != null) {
					schedule.setIdIfNotExist(existingSchedule.getId());
				}
				schedule.setDuties(new ArrayList<>(schedule.getDuties()));
			}

			wardScheduleRepository.saveAll(updatedScheduleList);
		}
	}
}

