package net.dutymate.api.domain.community.dto;

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
