package net.dutymate.api.domain.notice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.notice.dto.NoticeRequestDto;
import net.dutymate.api.domain.notice.service.NoticeService;
import net.dutymate.api.global.auth.annotation.Auth;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notice")
public class NoticeController {

	private final NoticeService noticeService;

	@GetMapping
	public ResponseEntity<?> getNoticeList() {
		return ResponseEntity.ok(noticeService.getNoticeList());
	}

	@GetMapping("/{noticeId}")
	public ResponseEntity<?> getNoticeDetail(@PathVariable("noticeId") Long noticeId) {
		return ResponseEntity.ok(noticeService.getNoticeDetail(noticeId));
	}

	@PostMapping
	public ResponseEntity<?> createNotice(@Auth Member member, @RequestBody NoticeRequestDto noticeRequestDto) {
		noticeService.createNotice(member, noticeRequestDto);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/{noticeId}")
	public ResponseEntity<?> updateNotice(@PathVariable("noticeId") Long noticeId,
		@Auth Member member, @RequestBody NoticeRequestDto noticeRequestDto) {
		noticeService.updateNotice(member, noticeId, noticeRequestDto);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{noticeId}")
	public ResponseEntity<?> deleteNotice(@PathVariable("noticeId") Long noticeId, @Auth Member member) {
		noticeService.deleteNotice(member, noticeId);
		return ResponseEntity.ok().build();
	}
}
