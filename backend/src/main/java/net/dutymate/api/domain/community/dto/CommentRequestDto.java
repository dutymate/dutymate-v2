package net.dutymate.api.domain.community.dto;

import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.Comment;
import net.dutymate.api.domain.member.Member;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequestDto {

	@Size(max = 250, message = "댓글은 최대 250자입니다.")
	private String content;

	public Comment toComment(Board board, Member member) {
		return Comment.builder()
			.board(board)
			.member(member)
			.content(content)
			.build();
	}
}
