package net.dutymate.api.domain.wardschedules.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.autoschedule.Shift;
import net.dutymate.api.domain.calendar.Calendar;
import net.dutymate.api.domain.calendar.repository.CalendarRepository;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.repository.MemberRepository;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.request.repository.RequestRepository;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.wardmember.Role;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.repository.WardMemberRepository;
import net.dutymate.api.domain.wardschedules.collections.MemberSchedule;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;
import net.dutymate.api.domain.wardschedules.dto.AllWardDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.EditDutyRequestDto;
import net.dutymate.api.domain.wardschedules.dto.EditMemberDutyRequestDto;
import net.dutymate.api.domain.wardschedules.dto.MyDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.TodayDutyResponseDto;
import net.dutymate.api.domain.wardschedules.dto.WardScheduleResponseDto;
import net.dutymate.api.domain.wardschedules.repository.MemberScheduleRepository;
import net.dutymate.api.domain.wardschedules.repository.WardScheduleRepository;
import net.dutymate.api.domain.wardschedules.util.DutyAutoCheck;
import net.dutymate.api.domain.wardschedules.util.InitialDutyGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WardScheduleService {

	private final MemberRepository memberRepository;
	private final WardScheduleRepository wardScheduleRepository;
	private final InitialDutyGenerator initialDutyGenerator;
	private final RequestRepository requestRepository;
	private final WardMemberRepository wardMemberRepository;
	private final MemberScheduleRepository memberScheduleRepository;
	private final CalendarRepository calendarRepository;

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

		// 듀티표 멤버ID 목록
		HashSet<Long> updatedMemberIds = new HashSet<>();

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

			// 병동 스케줄에 있는 멤버 ID 목록에 추가
			if (!"(탈퇴회원)".equals(now.getName())) {
				updatedMemberIds.add(now.getMemberId());
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
							case M -> 1;
							case ALL -> 2;  // ALL이 두 번째
							case N -> 4;    // N이 가장 아래
							default -> 3;   // 기타 케이스는 ALL과 N 사이
						};
					})
					.thenComparing(WardScheduleResponseDto.NurseShifts::getGrade,
						Comparator.nullsLast(Comparator.reverseOrder()))
			)
			.toList();

		// Issues 구하기
		List<WardScheduleResponseDto.Issue> issues = DutyAutoCheck.check(nurseShiftsDto, ward.getRule());

		// History 구하기
		List<WardScheduleResponseDto.History> histories = findHistory(wardSchedule.getDuties());

		// 승인, 대기 상태인 요청 구하기
		List<WardScheduleResponseDto.RequestDto> requests = null;

		// 병동 듀티 -> 개인 듀티 : 연동 작업
		List<MemberSchedule> memberSchedulesToSave = new ArrayList<>();
		for (Long updatedMemberId : updatedMemberIds) {
			Member updatedMember = memberRepository.findById(updatedMemberId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."));

			// 수정된 병동 스케줄 연월이 업데이트된 회원의 입장 연월보다 이후이면 memberSchedule 업데이트
			if (yearMonth.isSameOrAfter(updatedMember.enterYearMonth())) {
				MemberSchedule memberSchedule = getOrCreateMemberSchedule(updatedMemberId, yearMonth);

				String updatedShifts = wardSchedule.getDuties()
					.get(nowIdx)
					.getDuty()
					.stream()
					.filter(nurseShift -> Objects.equals(nurseShift.getMemberId(), updatedMemberId))
					.findAny()
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 스케줄에서 회원을 찾을 수 없습니다."))
					.getShifts();

				memberSchedule.setShifts(updatedShifts);
				memberSchedulesToSave.add(memberSchedule);
			}
		}
		// 개인 듀티를 모아서 한 번에 저장
		memberScheduleRepository.saveAll(memberSchedulesToSave);

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
		// 1. 이전 달, 다음 달 계산
		// 이전 연, 월 초기화
		YearMonth prevYearMonth = yearMonth.prevYearMonth();
		// 다음 연, 월 초기화
		YearMonth nextYearMonth = yearMonth.nextYearMonth();
		// 일주일 상수 초기화
		final int daysInAWeek = 7;

		// 2. 근무표 조회
		// 사용자 병동 입장X
		String shifts = getOrCreateMemberSchedule(member.getMemberId(), yearMonth).getShifts();
		String prevShifts = getOrCreateMemberSchedule(member.getMemberId(), prevYearMonth).getShifts()
			.substring(prevYearMonth.daysInMonth() - daysInAWeek);
		String nextShifts = getOrCreateMemberSchedule(member.getMemberId(), nextYearMonth).getShifts()
			.substring(0, daysInAWeek);


		// 3. 날짜 범위 계산
		LocalDate firstDay = yearMonth.atDay(1); // 이번달 1일
		LocalDate lastDay = yearMonth.atEndOfMonth(); // 이번달 말일
		LocalDate prevStart = firstDay.minusDays(daysInAWeek); // 전달 7일 시작 날짜
		LocalDate nextEnd = lastDay.plusDays(daysInAWeek); // 다음달 7일 끝나는 날짜

		// 4. 일정 조회
		// 전달 7일 ~ 다음달 7일까지 일정 조회
		List<Calendar> calendars = calendarRepository.findAllByMemberAndDateBetween(member, prevStart, nextEnd);

		// 5. 일정 분류하기
		List<MyDutyResponseDto.CalendarEvent> prevCalendar = new ArrayList<>();
		List<MyDutyResponseDto.CalendarEvent> currentCalendar = new ArrayList<>();
		List<MyDutyResponseDto.CalendarEvent> nextCalendar = new ArrayList<>();

		for(Calendar calendar : calendars) {

			LocalDate date = calendar.getDate();
			MyDutyResponseDto.CalendarEvent event = new MyDutyResponseDto.CalendarEvent();

			event.setDate(date);
			event.setTitle(calendar.getTitle());
			event.setColor(calendar.getColor());

			if(date.isBefore(firstDay)){
				prevCalendar.add(event);
			}else if(date.isAfter(lastDay)){
				nextCalendar.add(event);
			}else{
				currentCalendar.add(event);
			}

		}

		// 6. calendar DTO 구성
		MyDutyResponseDto.CalendarData calendarData = new MyDutyResponseDto.CalendarData();
		calendarData.setPrevCalendar(prevCalendar);
		calendarData.setCurrCalendar(currentCalendar);
		calendarData.setNextCalendar(nextCalendar);

		return MyDutyResponseDto.of(yearMonth, prevShifts, nextShifts, shifts, calendarData);
	}

	// 병동 스케줄에서 현재 로그인한 멤버의 듀티 구하기
	public String getShiftsInWard(Member member, WardSchedule wardSchedule, int daysInMonth) {
		if (wardSchedule == null) {
			return "X".repeat(daysInMonth);
		}

		return wardSchedule.getDuties().get(wardSchedule.getNowIdx()).getDuty().stream()
			.filter(o -> Objects.equals(o.getMemberId(), member.getMemberId()))
			.findAny()
			.orElseGet(() -> WardSchedule.NurseShift.builder().shifts("X".repeat(daysInMonth)).build())
			.getShifts();
	}

	// 병동 입장 연월로 shifts 구하기
	private String getShiftsByEnterDate(Member member, YearMonth yearMonth) {
		YearMonth enterYearMonth = new YearMonth(member.getEnterYear(), member.getEnterMonth());

		// 1~4월 : 개인 듀티 조회
		if (yearMonth.isBefore(enterYearMonth)) {
			return getOrCreateMemberSchedule(member.getMemberId(), yearMonth).getShifts();
		}

		// 5~12월 : 병동 듀티 조회
		WardSchedule wardSchedule = wardScheduleRepository
			.findByWardIdAndYearAndMonth(member.getWardMember().getWard().getWardId(), yearMonth.year(),
				yearMonth.month()).orElse(null);

		return getShiftsInWard(member, wardSchedule, yearMonth.daysInMonth());
	}

	public MemberSchedule getOrCreateMemberSchedule(Long memberId, YearMonth yearMonth) {
		return memberScheduleRepository
			.findByMemberIdAndYearAndMonth(memberId, yearMonth.year(), yearMonth.month())
			.orElseGet(
				() -> memberScheduleRepository.save(createBlankMemberSchedule(memberId, yearMonth)));
	}

	// 비어있는 MemberSchedule 만들기
	public static MemberSchedule createBlankMemberSchedule(Long memberId, final YearMonth yearMonth) {
		return MemberSchedule.builder()
			.memberId(memberId)
			.year(yearMonth.year())
			.month(yearMonth.month())
			.shifts(yearMonth.initializeShifts())
			.build();
	}

	@Transactional(readOnly = true)
	public TodayDutyResponseDto getTodayDuty(
		Member member, final Integer year, final Integer month, final Integer date) {

		// 병동멤버와 병동 불러오기
		WardMember wardMember = member.getWardMember();

		// 병동 미가입 평간호사는 본인의 근무만 개인 듀티에서 구한 후 종료한다.
		if (wardMember == null) {
			MemberSchedule memberSchedule = getOrCreateMemberSchedule(member.getMemberId(), new YearMonth(year, month));
			char myShift = memberSchedule.getShifts().charAt(date - 1);
			return TodayDutyResponseDto.of(myShift, null);
		}

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
	public AllWardDutyResponseDto getAllWardDuty(Member member, Integer year, Integer month) {
		WardMember wardMember = member.getWardMember();

		if (wardMember == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속하지 않은 회원입니다.");
		}

		// 1. 입력된 연월 가져오기, null이면 현재 연월
		YearMonth yearMonth = new YearMonth(year, month);

		// 2. 병동 정보 조회
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
				wardMember.getWard().getWardId(), yearMonth.year(), yearMonth.month())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 월 듀티표가 존재하지 않습니다."));

		// 3. 가장 최신 duty 가져오기 (비어있는 경우 예외 처리)
		List<WardSchedule.Duty> duties = wardSchedule.getDuties();
		if (duties.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 월 듀티표가 존재하지 않습니다.");
		}

		WardSchedule.Duty latestSchedule = duties.getLast();

		// 4. 성능 개선: 모든 WardMember를 한 번에 조회 (N+1 문제 해결)
		List<Long> memberIds = latestSchedule.getDuty().stream()
			.map(WardSchedule.NurseShift::getMemberId)
			.toList();

		// Member ID로 WardMember 맵 생성 (최적화)
		Map<Long, WardMember> wardMemberMap = wardMemberRepository.findByMember_MemberIdIn(memberIds)
			.stream()
			.collect(Collectors.toMap(
				wm -> wm.getMember().getMemberId(),
				wm -> wm
			));

		// 탈퇴 회원 처리: 누락된 memberId에 대해 더미 WardMember 생성
		for (Long memberId : memberIds) {
			if (!wardMemberMap.containsKey(memberId)) {
				// 더미 Member 생성
				Member deletedMember = Member.builder()
					.memberId(memberId)
					.name("(탈퇴회원)")
					.role(Role.RN)
					.grade(1)
					.build();

				// 더미 WardMember 생성
				WardMember dummyWardMember = WardMember.builder()
					.member(deletedMember)
					.shiftType(ShiftType.ALL)
					.build();

				wardMemberMap.put(memberId, dummyWardMember);
			}
		}

		// 5. NurseShift를 AllNurseShift로 변환하고 정렬
		List<AllWardDutyResponseDto.AllNurseShift> nurseShiftList = latestSchedule.getDuty().stream()
			.map(nurseShift -> {
				Long memberId = nurseShift.getMemberId();
				// Member ID로 WardMember 조회 (맵 사용)
				WardMember nurse = wardMemberMap.get(memberId);

				if (nurse == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"멤버 ID " + memberId + "에 해당하는 병동 멤버 정보가 없습니다.");
				}

				Member nurseMember = nurse.getMember();
				return AllWardDutyResponseDto.AllNurseShift.of(
					nurseMember.getMemberId(),
					nurseMember.getName(),
					nurseShift.getShifts(),
					nurseMember.getRole(),
					nurse.getShiftType(),
					nurseMember.getGrade()
				);
			})
			.sorted((a, b) -> {
				// 1. role로 정렬 (HN이 위로)
				if (a.getRole() == Role.HN && b.getRole() != Role.HN) {
					return -1;
				}
				if (a.getRole() != Role.HN && b.getRole() == Role.HN) {
					return 1;
				}

				// 2. role이 같은 경우 shiftType으로 정렬 (M > All > N)
				if (a.getRole() == b.getRole()) {
					if (a.getShiftType() == ShiftType.M && b.getShiftType() != ShiftType.M) {
						return -1;
					}
					if (a.getShiftType() != ShiftType.M && b.getShiftType() == ShiftType.M) {
						return 1;
					}
					if (a.getShiftType() == ShiftType.ALL && b.getShiftType() == ShiftType.N) {
						return -1;
					}
					if (a.getShiftType() == ShiftType.N && b.getShiftType() == ShiftType.ALL) {
						return 1;
					}
				}

				// 3. role과 shiftType이 같은 경우 grade로 정렬 (내림차순)
				return b.getGrade() - a.getGrade();
			})
			.toList();

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

		// 병동 듀티 -> 개인 듀티 : 연동 작업
		for (WardSchedule.NurseShift nurseShift : resetShift) {
			// 탈퇴회원일 수도 있다. 그러나 현재 초기화하면 탈퇴회원 듀티표 싹 사라지고 현재 병동에 속한 사람들로만 초기화 됨
			Member nurse = memberRepository.findById(nurseShift.getMemberId())
				.orElseGet(() -> Member.builder().name("(탈퇴회원)").role(Role.RN).grade(1).build());
			if (yearMonth.isSameOrAfter(nurse.enterYearMonth()) && !"(탈퇴회원)".equals(nurse.getName())) {
				getOrCreateMemberSchedule(nurseShift.getMemberId(), yearMonth).setShifts(nurseShift.getShifts());
			}
		}
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

	@Transactional
	public void editMemberSchedule(Member member, EditMemberDutyRequestDto editMemberDutyRequestDto) {
		if (member.getEnterYear() != null && member.getEnterMonth() != null && member.getWardMember() != null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 입장한 회원은 개인 근무표를 작성할 수 없습니다.");
		}

		YearMonth yearMonth = new YearMonth(editMemberDutyRequestDto.getYear(), editMemberDutyRequestDto.getMonth());
		MemberSchedule memberSchedule = getOrCreateMemberSchedule(member.getMemberId(), yearMonth);

		String currShifts = memberSchedule.getShifts();

		// 유효성 검사
		Integer day = editMemberDutyRequestDto.getDay();
		if (day < 1 || day > currShifts.length()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 날짜입니다.");
		}

		// 문자열 수정
		StringBuilder updatedShifts = new StringBuilder(currShifts);
		updatedShifts.setCharAt(day - 1, editMemberDutyRequestDto.getShift().getValue().charAt(0));
		memberSchedule.setShifts(updatedShifts.toString());

		// 저장
		memberScheduleRepository.save(memberSchedule);
	}
}

