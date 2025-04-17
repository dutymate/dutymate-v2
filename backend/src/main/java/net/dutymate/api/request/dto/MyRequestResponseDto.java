package net.dutymate.api.request.dto;

import java.sql.Date;

import net.dutymate.api.entity.Request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyRequestResponseDto {

	private Date date;
	private String shift;
	private String memo;
	private String status;

	public static MyRequestResponseDto of(Request request) {
		return MyRequestResponseDto.builder()
			.date(request.getRequestDate())
			.shift(String.valueOf(request.getRequestShift()))
			.memo(request.getMemo())
			.status(String.valueOf(request.getStatus()))
			.build();
	}
}
