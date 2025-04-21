package net.dutymate.api.domain.community.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.entity.community.Board;
import net.dutymate.api.global.enums.Category;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
	List<Board> findAllByCategory(Category category, Sort sort);

	boolean existsByBoardIdAndMember(Long boardId, Member member);
}
