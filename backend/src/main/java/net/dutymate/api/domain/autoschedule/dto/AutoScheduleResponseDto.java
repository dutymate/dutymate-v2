package net.dutymate.api.domain.autoschedule.dto;

import java.sql.Date;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoScheduleResponseDto {
	private String message;
	private boolean isSuccess;
	private int unreflectedRequestsCount;
	private List<UnreflectedRequestInfo> unreflectedRequests;

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class UnreflectedRequestInfo {
		private Long memberId;
		private String memberName;
		private Date requestDate;
		private String requestShift;
	}
}
