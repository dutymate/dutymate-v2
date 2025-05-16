package net.dutymate.api.domain.community.dto;

import net.dutymate.api.domain.community.Category;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BoardUpdateRequestDto {

	@Size(max = 100, message = "제목은 최대 100자입니다.")
	private String title;
	@Size(max = 2000, message = "내용은 최대 2000자입니다.")
	private String content;
	private Category category;
	private String boardImgUrl;
}
