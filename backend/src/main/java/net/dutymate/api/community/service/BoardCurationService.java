package net.dutymate.api.comunity.service;

import java.sql.Timestamp;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import net.dutymate.api.comunity.dto.RecommendResponseDto;
import net.dutymate.api.comunity.repository.BoardRepository;
import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BoardCurationService {

	private static final double TIME_DECAY_FACTOR = 0.0289;
	private static final double SAME_GRADE_WEIGHT = 2.0;
	private static final double OTHER_GRADE_WEIGHT = 0.5;
	private static final int MIN_LIKE_THRESHOLD = 10;
	private static final double LIKE_COUNT_POWER = 3.0;
	private static final double LIKE_RATIO_POWER = 2.0;

	private final BoardRepository boardRepository;

	public RecommendResponseDto getCuratedBoards(Member viewer) {
		List<Board> boards = boardRepository.findAll();
		List<CuratedBoard> curatedBoards = boards.stream()
			.map(board -> new CuratedBoard(board, calculateScore(board, viewer)))
			.sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
			.limit(3)
			.toList();

		return createResponseDto(curatedBoards);
	}

	private double calculateScore(Board board, Member viewer) {
		int totalLikes = getTotalLikes(board);
		if (totalLikes < MIN_LIKE_THRESHOLD) {
			return 0.3;
		}

		double likeScore = calculateLikeScore(board, viewer);
		double timeDecay = calculateTimeDecay(board.getCreatedAt());
		double gradeWeight = (getGradeGroup(board.getMember().getGrade()) == getGradeGroup(viewer.getGrade()))
			? SAME_GRADE_WEIGHT
			: OTHER_GRADE_WEIGHT;

		return Math.pow(likeScore, 1.5) * timeDecay * gradeWeight;
	}

	private double calculateLikeScore(Board board, Member viewer) {
		int totalLikes = getTotalLikes(board);
		if (totalLikes == 0) {
			return 0;
		}

		int gradeGroupLikes = switch (getGradeGroup(viewer.getGrade())) {
			case 1 -> board.getLikesCntLow();
			case 2 -> board.getLikesCntMid();
			case 3 -> board.getLikesCntHigh();
			default -> 0;
		};

		double likeRatio = (double)gradeGroupLikes / totalLikes;

		double baseScore = Math.pow(Math.log10(totalLikes + 1), LIKE_COUNT_POWER);
		double ratioBonus = Math.pow(likeRatio, LIKE_RATIO_POWER);

		return baseScore * (1 + ratioBonus);
	}

	private int getGradeGroup(Integer grade) {
		if (grade <= 4) {
			return 1;  // 저연차
		}
		if (grade <= 10) {
			return 2; // 중연차
		}
		return 3;                  // 고연차
	}

	private double calculateTimeDecay(Timestamp createdAt) {
		long hoursSinceCreation = TimeUnit.MILLISECONDS.toHours(
			System.currentTimeMillis() - createdAt.getTime()
		);

		return hoursSinceCreation <= 24
			? 1.0 - (hoursSinceCreation * 0.01)
			: Math.exp(-TIME_DECAY_FACTOR * (hoursSinceCreation - 24)) * 0.76;
	}

	private int getTotalLikes(Board board) {
		return board.getLikesCntLow() + board.getLikesCntMid() + board.getLikesCntHigh();
	}

	private RecommendResponseDto createResponseDto(List<CuratedBoard> curatedBoards) {
		RecommendResponseDto responseDto = new RecommendResponseDto();
		List<RecommendResponseDto.RecommendedBoard> recommendedBoards = curatedBoards.stream()
			.map(curatedBoard -> {
				RecommendResponseDto.RecommendedBoard recommendedBoard = responseDto.new RecommendedBoard();
				recommendedBoard.setBoardId(curatedBoard.getBoard().getBoardId());
				recommendedBoard.setTitle(curatedBoard.getBoard().getTitle());
				return recommendedBoard;
			})
			.toList();
		responseDto.setBoardList(recommendedBoards);
		return responseDto;
	}

	@Getter
	private static class CuratedBoard {
		private final Board board;
		private final double score;

		public CuratedBoard(Board board, double score) {
			this.board = board;
			this.score = score;
		}
	}
}
