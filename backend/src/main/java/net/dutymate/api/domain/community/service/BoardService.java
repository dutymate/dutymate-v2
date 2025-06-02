package net.dutymate.api.domain.community.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.common.service.S3Service;
import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.BoardLikes;
import net.dutymate.api.domain.community.Category;
import net.dutymate.api.domain.community.HotBoard;
import net.dutymate.api.domain.community.dto.BoardCreateRequestDto;
import net.dutymate.api.domain.community.dto.BoardDetailResponseDto;
import net.dutymate.api.domain.community.dto.BoardImgResponseDto;
import net.dutymate.api.domain.community.dto.BoardListResponseDto;
import net.dutymate.api.domain.community.dto.BoardUpdateRequestDto;
import net.dutymate.api.domain.community.repository.BoardLikesRepository;
import net.dutymate.api.domain.community.repository.BoardRepository;
import net.dutymate.api.domain.community.repository.HotBoardRepository;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.xss.XssSanitizer;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BoardService {

	private final S3Service s3Service;
	private final BoardRepository boardRepository;
	private final BoardLikesRepository boardLikesRepository;
	private final HotBoardRepository hotBoardRepository;

	@Transactional
	public ResponseEntity<?> createBoard(BoardCreateRequestDto boardCreateRequestDto, Member member) {

		// XSS 방지
		String cleanTitle = XssSanitizer.clean(boardCreateRequestDto.getTitle());
		String cleanContent = XssSanitizer.clean(boardCreateRequestDto.getContent());
		boardCreateRequestDto.setTitle(cleanTitle);
		boardCreateRequestDto.setContent(cleanContent);

		Board newBoard = boardCreateRequestDto.toBoard(member, boardCreateRequestDto);
		member.getBoardList().add(newBoard);
		boardRepository.save(newBoard);

		return ResponseEntity.ok().build();
	}

	@Transactional(readOnly = true)
	public List<BoardListResponseDto> getAllBoard(Category category) {
		Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");

		if (category == Category.ALL) {
			return boardRepository.findAll(sort)
				.stream()
				.map(BoardListResponseDto::of)
				.toList();
		}

		if (category == Category.HOT) {
			return hotBoardRepository.findAll(Sort.by(Sort.Direction.DESC, "uploadAtHotBoard"))
				.stream()
				.map(HotBoard::getBoard)
				.map(BoardListResponseDto::of)
				.toList();
		}

		return boardRepository.findAllByCategory(category, sort)
			.stream()
			.map(BoardListResponseDto::of)
			.toList();
	}

	@Transactional
	public BoardDetailResponseDto getBoard(Long boardId, Member member) {
		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));
		board.increaseViewCnt();
		boolean isLike = boardLikesRepository.existsByBoardAndMember(board, member);
		return BoardDetailResponseDto.of(board, member, isLike);
	}

	@Transactional
	public void removeBoard(Long boardId, Member member) {
		if (!boardRepository.existsByBoardIdAndMember(boardId, member)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않거나 본인이 작성한 글이 아닙니다.");
		}

		boardRepository.deleteById(boardId);
	}

	@Transactional
	public BoardImgResponseDto uploadBoardImage(MultipartFile multipartFile) {
		String dirName = "board";
		String fileUrl = s3Service.uploadImage(dirName, multipartFile);

		return BoardImgResponseDto.of(fileUrl);

	}

	@Transactional
	public void boardLike(Long boardId, Member member) {
		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));

		if (!boardLikesRepository.existsByBoardAndMember(board, member)) {
			BoardLikes boardLikes = BoardLikes.builder().board(board).member(member).build();
			boardLikesRepository.save(boardLikes);
			board.increaseLikeCnt(member.getGrade());

			if (board.getLikesCnt() == 10) {
				HotBoard hotBoard = HotBoard.builder().board(board).build();
				hotBoardRepository.save(hotBoard);
			}
		}
	}

	@Transactional
	public void boardLikeDelete(Long boardId, Member member) {
		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));

		if (boardLikesRepository.existsByBoardAndMember(board, member)) {
			boardLikesRepository.deleteByBoardAndMember(board, member);
			board.decreaseLikeCnt(member.getGrade());

			if (board.getLikesCnt() == 9) {
				hotBoardRepository.deleteByBoard(board);
			}
		}
	}

	@Transactional
	public void updateBoard(Long boardId, Member member, @Valid BoardUpdateRequestDto boardUpdateRequestDto) {

		Board board = boardRepository.findById(boardId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 게시글입니다."));

		if (!board.getMember().equals(member)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 작성한 글만 수정할 수 있습니다.");
		}

		// XSS 방지
		String cleanTitle = XssSanitizer.clean(boardUpdateRequestDto.getTitle());
		String cleanContent = XssSanitizer.clean(boardUpdateRequestDto.getContent());
		boardUpdateRequestDto.setTitle(cleanTitle);
		boardUpdateRequestDto.setContent(cleanContent);

		board.update(boardUpdateRequestDto);
	}
}
