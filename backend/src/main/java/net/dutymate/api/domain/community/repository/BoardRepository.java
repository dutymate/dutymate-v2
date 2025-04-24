package net.dutymate.api.domain.community.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.Category;
import net.dutymate.api.domain.member.Member;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
	List<Board> findAllByCategory(Category category, Sort sort);

	boolean existsByBoardIdAndMember(Long boardId, Member member);
}
