package net.dutymate.api.wardschedules.util;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class InitialDutyGenerator {

	private final WardScheduleRepository wardScheduleRepository;

	/**
	 * Duty 초기화 메서드 (병동 생성 시에만 사용)
	 *
	 * @return
	 */
	public WardSchedule initializedDuty(WardMember wardMember, YearMonth yearMonth) {
		return createNewWardSchedule(wardMember.getWard(), List.of(wardMember), yearMonth);
	}

	/**
	 * 새로운 WardSchedule 생성 (병동 생성 시)
	 */
	public WardSchedule createNewWardSchedule(Ward ward, List<WardMember> wardMemberList,
		YearMonth yearMonth) {

		// 병동 생성 시, 초기화된 duty 생성
		WardSchedule.Duty duty = createInitialDuty();

		wardMemberList.forEach(nurse -> duty.addNurseShift(
			createNurseShift(nurse, yearMonth.initializeShifts())));

		WardSchedule newSchedule = WardSchedule.builder()
			.wardId(ward.getWardId())
			.year(yearMonth.year())
			.month(yearMonth.month())
			.nowIdx(0)
			.duties(List.of(duty)) // 초기 duty 리스트 추가
			.build();

		// mongodb 저장
		return wardScheduleRepository.save(newSchedule);
	}

	/**
	 * 기존 스케줄에 새로운 멤버 추가하여 새 스냅샷 생성 (병동 입장 시)
	 */
	public WardSchedule updateDutyWithNewMember(WardSchedule existingSchedule, WardMember newWardMember) {

		String initializedShifts
			= new YearMonth(existingSchedule.getYear(), existingSchedule.getMonth()).initializeShifts();

		WardSchedule.NurseShift nurseShift = createNurseShift(newWardMember, initializedShifts);

		// 1. 기존의 duty 마지막에 새로운 멤버 추가
		WardSchedule.Duty currentDuty =
			existingSchedule.getDuties().isEmpty()
				? WardSchedule.Duty.builder()
				.idx(0)
				.duty(new ArrayList<>())
				.history(createInitialHistory())
				.build()
				: existingSchedule.getDuties().get(existingSchedule.getNowIdx());

		// 2. 새로운 Duty 생성 (idx = 0, duty = nowIdx에 해당하는 duty 복사, history = 초기화)
		WardSchedule.Duty newDuty = WardSchedule.Duty.builder()
			.idx(0)
			.duty(new ArrayList<>(currentDuty.getDuty()))
			.history(createInitialHistory())
			.build();

		// 마지막 duty에 새로운 멤버 초기화된 값 추가
		newDuty.addNurseShift(nurseShift);

		return WardSchedule.builder()
			.id(existingSchedule.getId())
			.wardId(newWardMember.getWard().getWardId())
			.year(existingSchedule.getYear())
			.month(existingSchedule.getMonth())
			.nowIdx(0)
			.duties(new ArrayList<>(List.of(newDuty)))
			.build();
	}

	// duty 초기화하기
	private WardSchedule.Duty createInitialDuty() {

		return WardSchedule.Duty.builder()
			.idx(0) // 병동 생성 시, idx는 0으로 입력
			.duty(new ArrayList<>())
			.history(createInitialHistory())
			.build();
	}

	// 초기화된 history 생성
	public WardSchedule.History createInitialHistory() {
		return WardSchedule.History.builder()
			.memberId(0L)
			.name("")
			.before("")
			.after("")
			.modifiedDay(0)
			.isAutoCreated(false)
			.build();
	}

	// 초기 duty 생성을 위한 NurseShift 생성 메서드
	public WardSchedule.NurseShift createNurseShift(WardMember wardMember, String initializedShifts) {

		return WardSchedule.NurseShift.builder()
			.memberId(wardMember.getMember().getMemberId())
			.shifts(initializedShifts)
			.build();
	}
}
