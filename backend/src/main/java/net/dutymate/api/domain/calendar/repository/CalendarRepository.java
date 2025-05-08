package net.dutymate.api.domain.calendar.repository;

import java.time.LocalDateTime;
import java.util.List;

import net.dutymate.api.domain.calendar.entity.Calendar;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarRepository extends JpaRepository<Calendar, Long> {
	//날짜 기준 조회 쿼리 메서드 추가
	List<Calendar> findAllByStartTimeBetween(LocalDateTime start, LocalDateTime end);

}
