package net.dutymate.api.domain.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.BoardLikes;
import net.dutymate.api.domain.member.Member;

@Repository
public interface BoardLikesRepository extends JpaRepository<BoardLikes, Long> {
	void deleteByBoardAndMember(Board board, Member member);

	boolean existsByBoardAndMember(Board board, Member member);
}
