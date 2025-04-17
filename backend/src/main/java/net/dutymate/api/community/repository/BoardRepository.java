package net.dutymate.api.comunity.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.enumclass.Category;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
	List<Board> findAllByCategory(Category category, Sort sort);

	boolean existsByBoardIdAndMember(Long boardId, Member member);
}
