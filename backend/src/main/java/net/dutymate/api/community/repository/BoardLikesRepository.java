package net.dutymate.api.comunity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.BoardLikes;

@Repository
public interface BoardLikesRepository extends JpaRepository<BoardLikes, Long> {
	void deleteByBoardAndMember(Board board, Member member);

	boolean existsByBoardAndMember(Board board, Member member);
}
