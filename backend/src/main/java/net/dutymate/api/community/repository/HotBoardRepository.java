package net.dutymate.api.comunity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.HotBoard;

@Repository
public interface HotBoardRepository extends JpaRepository<HotBoard, Long> {

	void deleteByBoard(Board board);
}
