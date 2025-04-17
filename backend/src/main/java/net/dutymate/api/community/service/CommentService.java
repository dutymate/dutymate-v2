package net.dutymate.api.comunity.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.comunity.dto.BoardDetailResponseDto;
import net.dutymate.api.comunity.dto.CommentRequestDto;
import net.dutymate.api.comunity.repository.BoardRepository;
import net.dutymate.api.comunity.repository.CommentRepository;
import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.Comment;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

	private final CommentRepository commentRepository;
	private final BoardRepository boardRepository;

	@Transactional
	public BoardDetailResponseDto.CommentDto writeComment(Long boardId, CommentRequestDto commentRequestDto,
		Member member) {
		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));
		Comment comment = commentRequestDto.toComment(board, member);
		commentRepository.save(comment);
		board.getCommentList().add(comment);

		return BoardDetailResponseDto.CommentDto.of(comment, member);
	}

	@Transactional
	public void removeComment(Long boardId, Long commentId, Member member) {
		if (!commentRepository.existsByCommentIdAndMember(commentId, member)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않거나 본인이 작성한 댓글이 아닙니다.");
		}

		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));
		Comment comment = commentRepository.findById(commentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 댓글입니다."));

		if (board != comment.getBoard()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 게시글에 작성된 댓글이 아닙니다.");
		}

		commentRepository.delete(comment);
	}

	@Transactional
	public void updateComment(Long boardId, Long commentId, Member member, CommentRequestDto commentRequestDto) {
		if (!commentRepository.existsByCommentIdAndMember(commentId, member)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않거나 본인이 작성한 댓글이 아닙니다.");
		}

		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));
		Comment comment = commentRepository.findById(commentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 댓글입니다."));

		if (board != comment.getBoard()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 게시글에 작성된 댓글이 아닙니다.");
		}
		comment.updateComment(commentRequestDto.getContent());
	}
}
