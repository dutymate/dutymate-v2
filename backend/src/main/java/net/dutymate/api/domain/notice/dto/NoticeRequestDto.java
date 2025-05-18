package net.dutymate.api.domain.notice.dto;

import net.dutymate.api.domain.notice.Notice;

import lombok.Data;

@Data
public class NoticeRequestDto {

	private String title;
	private String content;
	private Boolean isPinned;

	public Notice toNotice() {
		return Notice.builder()
			.title(title)
			.content(content)
			.isPinned(isPinned != null && isPinned)
			.build();
	}
}
