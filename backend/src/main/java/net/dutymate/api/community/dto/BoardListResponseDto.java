package net.dutymate.api.comunity.dto;

import net.dutymate.api.entity.community.Board;
import net.dutymate.api.enumclass.Category;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardListResponseDto {

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

	public static BoardListResponseDto of(Board board) {
		return BoardListResponseDto.builder()
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
			.build();
	}
}
