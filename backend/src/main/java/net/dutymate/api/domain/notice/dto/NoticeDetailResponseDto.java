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
	private LocalDateTime createdAt;

	public static NoticeDetailResponseDto of(Notice notice) {
		return NoticeDetailResponseDto.builder()
			.noticeId(notice.getNoticeId())
			.title(notice.getTitle())
			.content(notice.getContent())
			.createdAt(notice.getCreatedAt())
			.build();
	}
}
