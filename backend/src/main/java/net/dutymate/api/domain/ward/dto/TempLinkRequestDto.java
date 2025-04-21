package net.dutymate.api.domain.ward.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TempLinkRequestDto {

	private Long tempMemberId;
}
