package net.dutymate.api.domain.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.HotBoard;

@Repository
public interface HotBoardRepository extends JpaRepository<HotBoard, Long> {

	void deleteByBoard(Board board);
}
