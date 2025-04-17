package net.dutymate.api.request.util;

import java.util.List;

import org.springframework.stereotype.Component;

import net.dutymate.api.entity.Request;
import net.dutymate.api.enumclass.RequestStatus;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.wardschedules.collections.WardSchedule;

@Component
public class UpdateRequestStatuses {

	public void updateRequestStatuses(List<Request> requests, WardSchedule wardSchedule, YearMonth yearMonth) {
		if (requests.isEmpty() || wardSchedule.getDuties().isEmpty()) {
			return;
		}

		// 현재 적용된 최신 스케줄 가져오기
		WardSchedule.Duty currentDuty = wardSchedule.getDuties().get(wardSchedule.getNowIdx());
		List<WardSchedule.NurseShift> nurseShifts = currentDuty.getDuty();

		for (Request request : requests) {
			// 해당 간호사의 스케줄 찾기
			WardSchedule.NurseShift nurseShift = nurseShifts.stream()
				.filter(shift -> shift.getMemberId().equals(request.getWardMember().getMember().getMemberId()))
				.findFirst()
				.orElse(null);

			if (nurseShift != null) {
				// 요청한 날짜의 실제 배정된 근무와 요청한 근무 비교
				int requestDay = request.getRequestDate().getDate();
				String shifts = nurseShift.getShifts();

				// 날짜 인덱스가 유효한지 확인
				if (requestDay <= shifts.length()) {
					char assignedShift = shifts.charAt(requestDay - 1);
					char requestedShift = request.getRequestShift().getValue().charAt(0);

					// 요청이 반영되었는지 여부에 따라 상태 업데이트
					if (assignedShift == requestedShift) {
						request.changeStatus(RequestStatus.ACCEPTED);
					} else {
						request.changeStatus(RequestStatus.DENIED);
					}
				}
			}
		}
	}
}
