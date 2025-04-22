package net.dutymate.api.domain.wardschedules.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import net.dutymate.api.domain.wardschedules.collections.WardSchedule;

public interface WardScheduleRepository
	extends MongoRepository<WardSchedule, String> {

	Optional<WardSchedule> findByWardIdAndYearAndMonth(Long wardId, int year, int month);

	void deleteByWardId(Long wardId);
}
