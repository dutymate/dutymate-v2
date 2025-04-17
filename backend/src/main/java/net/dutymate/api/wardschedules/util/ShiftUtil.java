package net.dutymate.api.wardschedules.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.enumclass.Shift;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ShiftUtil {

	private final WardScheduleRepository wardScheduleRepository;
	private final InitialDutyGenerator initialDutyGenerator;

	// 병동 스케줄에서 Shift 조회 메서드
	public Shift getShift(int year, int month, int date, Member member) {
		Ward ward = member.getWardMember().getWard();
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(), year, month)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 병동입니다."));

		// 가장 최근 스냅샷
		List<WardSchedule.NurseShift> lastDuty = wardSchedule.getDuties().getLast().getDuty();

		String shifts = lastDuty.stream()
			.filter(prev -> Objects.equals(prev.getMemberId(), member.getMemberId()))
			.findAny()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "근무표에 간호사가 존재하지 않습니다."))
			.getShifts();

		return Shift.valueOf(String.valueOf(shifts.charAt(date - 1)));
	}

	// 병동 스케줄에서 Shift 변경 메서드
	public void changeShift(int year, int month, int date, Member member, Shift prevShift, Shift shift) {
		Ward ward = member.getWardMember().getWard();
		WardSchedule wardSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(ward.getWardId(), year, month)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 병동입니다."));

		// 가장 최근 스냅샷
		List<WardSchedule.NurseShift> lastDuty = wardSchedule.getDuties().getLast().getDuty();
		// 새로 만들 스냅샷
		List<WardSchedule.NurseShift> newDuty = new ArrayList<>();
		// 가장 최근 스냅샷 -> 새로 만들 스냅샷 복사 (깊은 복사)
		lastDuty.forEach(nurseShift -> newDuty.add(WardSchedule.NurseShift.builder()
			.memberId(nurseShift.getMemberId())
			.shifts(nurseShift.getShifts())
			.build()));

		// 새로 만들 스냅샷에 수정사항 반영
		newDuty.stream()
			.filter(prev -> Objects.equals(prev.getMemberId(), member.getMemberId()))
			.forEach(prev -> {
				String before = prev.getShifts();
				String after = before.substring(0, date - 1) + shift + before.substring(date);

				prev.changeShifts(after);
			});

		// 기존 병동 스케줄에 새로운 스냅샷 추가 및 저장
		wardSchedule.getDuties().add(WardSchedule.Duty.builder()
			.idx(wardSchedule.getNowIdx() + 1)
			.duty(newDuty)
			.history(WardSchedule.History.builder()
				.memberId(member.getMemberId())
				.name(member.getName())
				.before(String.valueOf(prevShift))
				.after(String.valueOf(shift))
				.modifiedDay(date)
				.isAutoCreated(false)
				.build()
			)
			.build());

		wardSchedule.setNowIdx(wardSchedule.getNowIdx() + 1);
		wardScheduleRepository.save(wardSchedule);
	}
}
