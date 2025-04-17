package net.dutymate.api.ward.dto;

import jakarta.validation.constraints.Max;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddNurseCntRequestDto {

	@Max(value = 19, message = "임시 간호사는 최대 20명까지 추가할 수 있습니다.")
	private Integer virtualNurseCnt;
}
