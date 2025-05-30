package net.dutymate.api.domain.request.dto;

import java.sql.Date;

import jakarta.validation.constraints.Size;

public record RequestCreateByAdminDto(
	Long memberId, Date date, String shift,
	@Size(max = 200, message = "메모는 최대 200자입니다.") String memo) {
}
