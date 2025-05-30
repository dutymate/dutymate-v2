package net.dutymate.api.domain.notice.dto;

import java.time.LocalDateTime;

import net.dutymate.api.domain.notice.Notice;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoticeDetailResponseDto {

	private Long noticeId;
	private String title;
	private String content;
	private Boolean isPinned;
	private LocalDateTime createdAt;

	public static NoticeDetailResponseDto of(Notice notice) {
		return NoticeDetailResponseDto.builder()
			.noticeId(notice.getNoticeId())
			.title(notice.getTitle())
			.content(notice.getContent())
			.isPinned(notice.isPinned())
			.createdAt(notice.getCreatedAt())
			.build();
	}
}
