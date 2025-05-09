package net.dutymate.api.domain.wardschedules.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import net.dutymate.api.domain.wardschedules.collections.MemberSchedule;

public interface MemberScheduleRepository extends MongoRepository<MemberSchedule, String> {

	Optional<MemberSchedule> findByMemberIdAndYearAndMonth(Long memberId, int year, int month);

	void deleteByMemberId(Long memberId);

	List<MemberSchedule> findAllByMemberIdInAndYearAndMonth(List<Long> memberIds, int year, int month);

}
