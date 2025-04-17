package net.dutymate.api.comunity.dto;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.enumclass.Category;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardCreateRequestDto {

	@Size(max = 100, message = "제목은 최대 100자입니다.")
	private String title;
	@Size(max = 2000, message = "내용은 최대 2000자입니다.")
	private String content;
	private Category category;
	private String boardImgUrl;

	public Board toBoard(Member member, BoardCreateRequestDto requestDto) {
		return Board.builder()
			.member(member)
			.title(requestDto.getTitle())
			.content(requestDto.getContent())
			.category(requestDto.getCategory())
			.boardImageUrl(requestDto.getBoardImgUrl())
			.viewCnt(0)
			.likesCntLow(0)
			.likesCntMid(0)
			.likesCntHigh(0)
			.build();
	}
}
