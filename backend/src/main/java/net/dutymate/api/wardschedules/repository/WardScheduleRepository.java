package net.dutymate.api.wardschedules.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import net.dutymate.api.wardschedules.collections.WardSchedule;

public interface WardScheduleRepository
	extends MongoRepository<WardSchedule, String> {

	Optional<WardSchedule> findByWardIdAndYearAndMonth(Long wardId, int year, int month);
}
