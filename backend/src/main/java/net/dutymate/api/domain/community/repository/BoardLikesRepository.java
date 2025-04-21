package net.dutymate.api.domain.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.entity.community.Board;
import net.dutymate.api.global.entity.community.BoardLikes;

@Repository
public interface BoardLikesRepository extends JpaRepository<BoardLikes, Long> {
	void deleteByBoardAndMember(Board board, Member member);

	boolean existsByBoardAndMember(Board board, Member member);
}
