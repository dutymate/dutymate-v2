package net.dutymate.api.comunity.service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.comunity.dto.BoardCreateRequestDto;
import net.dutymate.api.comunity.dto.BoardDetailResponseDto;
import net.dutymate.api.comunity.dto.BoardImgResponseDto;
import net.dutymate.api.comunity.dto.BoardListResponseDto;
import net.dutymate.api.comunity.repository.BoardLikesRepository;
import net.dutymate.api.comunity.repository.BoardRepository;
import net.dutymate.api.comunity.repository.HotBoardRepository;
import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.BoardLikes;
import net.dutymate.api.entity.community.HotBoard;
import net.dutymate.api.enumclass.Category;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class BoardService {

	private final S3Client s3Client;
	private final BoardRepository boardRepository;
	private final BoardLikesRepository boardLikesRepository;
	private final HotBoardRepository hotBoardRepository;

	@Value("${cloud.aws.region.static}")
	private String region;
	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	@Transactional
	public ResponseEntity<?> createBoard(BoardCreateRequestDto boardCreateRequestDto, Member member) {

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

		if (multipartFile == null || multipartFile.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
		}

		String fileName = createFileName(multipartFile.getOriginalFilename(), dirName);

		try {

			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucket)
				.key(fileName)
				.contentType(multipartFile.getContentType())
				.build();

			// InputStream을 사용하여 메모리 사용량 최소화
			s3Client.putObject(putObjectRequest,
				RequestBody.fromInputStream(multipartFile.getInputStream(), multipartFile.getSize()));

			String fileUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + fileName;

			return BoardImgResponseDto.of(fileUrl);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 업로드 중 오류가 발생했습니다.");
		}
	}

	// 파일명을 난수화하기 위해 UUID 활용
	private String createFileName(String fileName, String dirName) {
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String extension = getFileExtension(fileName);
		return dirName + "/" + uuid + extension;
	}

	private String getFileExtension(String fileName) {
		if (fileName == null || !fileName.contains(".")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일입니다.");
		}
		return fileName.substring(fileName.lastIndexOf("."));
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
}
