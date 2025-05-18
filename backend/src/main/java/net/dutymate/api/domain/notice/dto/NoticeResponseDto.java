package net.dutymate.api.domain.notice.dto;

import java.time.LocalDateTime;

import net.dutymate.api.domain.notice.Notice;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoticeResponseDto {

	private Long noticeId;
	private String title;
	private LocalDateTime createdAt;
	private Boolean isPinned;

	public static NoticeResponseDto of(Notice notice) {
		return NoticeResponseDto.builder()
			.noticeId(notice.getNoticeId())
			.title(notice.getTitle())
			.createdAt(notice.getCreatedAt())
			.build();
	}
}
