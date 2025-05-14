package net.dutymate.api.domain.calendar.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dutymate.api.domain.calendar.Calendar;
import net.dutymate.api.domain.member.Member;

public interface CalendarRepository extends JpaRepository<Calendar, Long> {

	List<Calendar> findAllByMemberAndDate(Member member, LocalDate date);

	List<Calendar> findAllByMemberAndDateBetween(Member member, LocalDate start, LocalDate end);
}
