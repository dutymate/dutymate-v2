package net.dutymate.api.domain.group.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupImgResponseDto {

	private String groupImgUrl;

	public static GroupImgResponseDto of(String groupImgUrl) {
		return GroupImgResponseDto.builder()
			.groupImgUrl(groupImgUrl)
			.build();
	}
}
