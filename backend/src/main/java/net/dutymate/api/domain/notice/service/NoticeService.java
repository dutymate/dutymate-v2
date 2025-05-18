package net.dutymate.api.domain.notice.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.notice.Notice;
import net.dutymate.api.domain.notice.dto.NoticeDetailResponseDto;
import net.dutymate.api.domain.notice.dto.NoticeRequestDto;
import net.dutymate.api.domain.notice.dto.NoticeResponseDto;
import net.dutymate.api.domain.notice.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeService {

	private static final String ADMIN_EMAIL = "dutymate.net@gmail.com";
	private final NoticeRepository noticeRepository;

	@Transactional(readOnly = true)
	public List<NoticeResponseDto> getNoticeList() {
		return noticeRepository.findAllByOrderByCreatedAtDesc()
			.stream()
			.map(NoticeResponseDto::of)
			.toList();
	}

	@Transactional(readOnly = true)
	public NoticeDetailResponseDto getNoticeDetail(Long noticeId) {
		return NoticeDetailResponseDto.of(noticeRepository.findById(noticeId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "공지사항이 존재하지 않습니다."))
		);
	}

	@Transactional
	public void createNotice(Member member, NoticeRequestDto noticeRequestDto) {
		checkAdmin(member);

		noticeRepository.save(noticeRequestDto.toNotice());
	}

	@Transactional
	public void updateNotice(Member member, Long noticeId, NoticeRequestDto noticeRequestDto) {
		checkAdmin(member);

		Notice notice = noticeRepository.findById(noticeId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "공지사항이 존재하지 않습니다."));

		notice.update(noticeRequestDto.getTitle(), noticeRequestDto.getContent(), noticeRequestDto.getIsPinned());
	}

	@Transactional
	public void deleteNotice(Member member, Long noticeId) {
		checkAdmin(member);

		if (!noticeRepository.existsById(noticeId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공지사항이 존재하지 않습니다.");
		}

		noticeRepository.deleteById(noticeId);
	}

	private void checkAdmin(Member member) {
		if (!ADMIN_EMAIL.equals(member.getEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자만 가능합니다.");
		}
	}
}
