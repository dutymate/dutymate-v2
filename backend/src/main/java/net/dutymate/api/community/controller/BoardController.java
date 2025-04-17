package net.dutymate.api.comunity.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.comunity.dto.BoardCreateRequestDto;
import net.dutymate.api.comunity.service.BoardService;
import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Category;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

	private final BoardService boardService;

	@PostMapping
	public ResponseEntity<?> createBoard(
		@Valid @RequestBody BoardCreateRequestDto boardCreateRequestDto,
		@Auth Member member) {

		return boardService.createBoard(boardCreateRequestDto, member);
	}

	@GetMapping
	public ResponseEntity<?> getAllBoard(@RequestParam Category category) {
		return ResponseEntity.ok(boardService.getAllBoard(category));
	}

	@GetMapping("/{boardId}")
	public ResponseEntity<?> getBoard(@PathVariable Long boardId, @Auth Member member) {
		return ResponseEntity.ok(boardService.getBoard(boardId, member));
	}

	@DeleteMapping("/{boardId}")
	public ResponseEntity<?> removeBoard(@PathVariable Long boardId, @Auth Member member) {
		boardService.removeBoard(boardId, member);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/image")
	public ResponseEntity<?> uploadBoardImage(@RequestParam("file") MultipartFile multipartFile) {
		return ResponseEntity.ok(boardService.uploadBoardImage(multipartFile));
	}

	@PostMapping("/{boardId}/like")
	public ResponseEntity<?> boardLike(@PathVariable Long boardId, @Auth Member member) {
		boardService.boardLike(boardId, member);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{boardId}/like")
	public ResponseEntity<?> boardLikeDelete(@PathVariable Long boardId, @Auth Member member) {
		boardService.boardLikeDelete(boardId, member);
		return ResponseEntity.ok().build();
	}
}
