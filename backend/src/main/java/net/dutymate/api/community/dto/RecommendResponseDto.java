package net.dutymate.api.comunity.dto;

import java.util.List;

import lombok.Data;

@Data
public class RecommendResponseDto {

	List<RecommendedBoard> boardList;

	@Data
	public class RecommendedBoard {
		Long boardId;
		String title;
	}

}
