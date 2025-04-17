package net.dutymate.api.comunity.dto;

import java.util.List;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.Comment;
import net.dutymate.api.enumclass.Category;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardDetailResponseDto {

	private Long boardId;
	private String nickname;
	private String profileImg;
	private String title;
	private String content;
	private String boardImgUrl;
	private Category category;
	private String createdAt;
	private Integer viewCnt;
	private Integer likeCnt;
	private Integer commentCnt;
	private Boolean isMyWrite;
	private Boolean isLike;
	private List<CommentDto> comments;

	public static BoardDetailResponseDto of(Board board, Member loginMember, boolean isLike) {
		return BoardDetailResponseDto.builder()
			.boardId(board.getBoardId())
			.nickname(board.getMember().getNickname())
			.profileImg(board.getMember().getProfileImg())
			.title(board.getTitle())
			.content(board.getContent())
			.boardImgUrl(board.getBoardImageUrl())
			.category(board.getCategory())
			.createdAt(board.getCreatedAt().toString())
			.viewCnt(board.getViewCnt())
			.likeCnt(board.getLikesCntHigh() + board.getLikesCntMid() + board.getLikesCntLow())
			.commentCnt(board.getCommentList().size())
			.isMyWrite(loginMember == board.getMember())
			.isLike(isLike)
			.comments(board.getCommentList().stream().map(o -> CommentDto.of(o, loginMember)).toList())
			.build();
	}

	@Data
	@Builder
	public static class CommentDto {
		private Long commentId;
		private String nickname;
		private String profileImg;
		private String createdAt;
		private String content;
		private Boolean isMyWrite;

		public static CommentDto of(Comment comment, Member loginMember) {
			return CommentDto.builder()
				.commentId(comment.getCommentId())
				.nickname(comment.getMember().getNickname())
				.profileImg(comment.getMember().getProfileImg())
				.createdAt(comment.getCreatedAt().toString())
				.content(comment.getContent())
				.isMyWrite(loginMember == comment.getMember())
				.build();
		}
	}

}
