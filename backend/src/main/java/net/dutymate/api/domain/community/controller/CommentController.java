package net.dutymate.api.domain.community.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.community.dto.BoardDetailResponseDto;
import net.dutymate.api.domain.community.dto.CommentRequestDto;
import net.dutymate.api.domain.community.service.CommentService;
import net.dutymate.api.global.auth.annotation.Auth;
import net.dutymate.api.global.entity.Member;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class CommentController {

	private final CommentService commentService;

	@PostMapping("/{boardId}/comment")
	public ResponseEntity<?> writeComment(
		@PathVariable Long boardId,
		@Valid @RequestBody CommentRequestDto commentRequestDto,
		@Auth Member member
	) {
		BoardDetailResponseDto.CommentDto commentResponseDto = commentService.writeComment(boardId, commentRequestDto,
			member);
		return ResponseEntity.ok(commentResponseDto);
	}

	@DeleteMapping("/{boardId}/comment/{commentId}")
	public ResponseEntity<?> removeComment(
		@PathVariable Long boardId,
		@PathVariable Long commentId,
		@Auth Member member
	) {
		commentService.removeComment(boardId, commentId, member);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/{boardId}/comment/{commentId}")
	public ResponseEntity<?> updateComment(
		@PathVariable Long boardId, @PathVariable Long commentId, @Auth Member member,
		@Valid @RequestBody CommentRequestDto commentRequestDto
	) {
		commentService.updateComment(boardId, commentId, member, commentRequestDto);
		return ResponseEntity.ok().build();
	}
}
