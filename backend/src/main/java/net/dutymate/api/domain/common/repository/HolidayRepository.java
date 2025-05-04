package net.dutymate.api.domain.common.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.common.Holiday;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

	@Query("SELECT h FROM Holiday h WHERE h.year = :year AND h.month = :month")
	List<Holiday> findHolidaysInMonth(@Param("year") int year, @Param("month") int month);

	boolean existsByDate(LocalDate date);
}
