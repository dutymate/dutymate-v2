package net.dutymate.api.ward.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.EnterWaiting;
import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;

@Repository
public interface EnterWaitingRepository extends JpaRepository<EnterWaiting, Long> {
	void removeByMemberAndWard(Member member, Ward ward);

	List<EnterWaiting> findByWard(Ward ward);

	boolean existsByMember(Member member);

	boolean existsByMemberAndWard(Member member, Ward ward);

	long countByWard(Ward ward);
}
