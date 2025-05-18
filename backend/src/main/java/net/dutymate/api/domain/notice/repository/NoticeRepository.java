package net.dutymate.api.domain.notice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dutymate.api.domain.notice.Notice;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

	List<Notice> findAllByOrderByCreatedAtDesc();
}
