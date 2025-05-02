package net.dutymate.api.domain.request.dto;

import java.sql.Date;

import net.dutymate.api.domain.request.Request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyRequestResponseDto {

	private Long requestId;
	private Date date;
	private String shift;
	private String memo;
	private String status;

	public static MyRequestResponseDto of(Request request) {
		return MyRequestResponseDto.builder()
			.requestId(request.getRequestId())
			.date(request.getRequestDate())
			.shift(String.valueOf(request.getRequestShift()))
			.memo(request.getMemo())
			.status(String.valueOf(request.getStatus()))
			.build();
	}
}
