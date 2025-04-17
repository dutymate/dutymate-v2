package net.dutymate.api.ward.dto;

import net.dutymate.api.enumclass.EnterStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EnterManagementRequestDto {

	private EnterStatus status;
}
