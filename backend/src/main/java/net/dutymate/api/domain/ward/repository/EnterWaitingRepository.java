package net.dutymate.api.domain.ward.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.ward.EnterWaiting;
import net.dutymate.api.domain.ward.Ward;

@Repository
public interface EnterWaitingRepository extends JpaRepository<EnterWaiting, Long> {
	void removeByMemberAndWard(Member member, Ward ward);

	List<EnterWaiting> findByWard(Ward ward);

	Optional<EnterWaiting> findByMember(Member member);

	boolean existsByMember(Member member);

	boolean existsByMemberAndWard(Member member, Ward ward);

	long countByWard(Ward ward);
}
