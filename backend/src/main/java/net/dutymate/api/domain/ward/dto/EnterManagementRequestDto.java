package net.dutymate.api.domain.ward.dto;

import net.dutymate.api.global.enums.EnterStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EnterManagementRequestDto {

	private EnterStatus status;
}
