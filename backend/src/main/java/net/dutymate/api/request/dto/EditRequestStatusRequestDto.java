package net.dutymate.api.request.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EditRequestStatusRequestDto {

	Long memberId;
	String status;
}
