package net.dutymate.api.domain.notice;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Notice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long noticeId;

	@Column(length = 200, nullable = false)
	private String title;

	@Lob
	@Column(nullable = false)
	private String content;

	@Column(nullable = false)
	private boolean isPinned = false; // 상단 고정 여부

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	// 생성 시간 자동 설정
	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

	public void update(String title, String content, boolean isPinned) {
		this.title = title;
		this.content = content;
		this.isPinned = isPinned;
	}
}
