package net.dutymate.api.request.dto;

import java.sql.Date;
import java.sql.Timestamp;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Request;
import net.dutymate.api.enumclass.RequestStatus;
import net.dutymate.api.enumclass.Shift;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RequestCreateDto {

	private Date date;
	private String shift;
	@Size(max = 200, message = "메모는 최대 200자입니다.")
	private String memo;

	public Request toRequest(Member member) {
		return Request.builder()
			.requestDate(date)
			.requestShift(Shift.valueOf(shift))
			.memo(memo)
			.wardMember(member.getWardMember())
			.createdAt(new Timestamp(System.currentTimeMillis()))
			.status(RequestStatus.HOLD)
			.build();
	}
}
