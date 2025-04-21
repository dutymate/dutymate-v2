package net.dutymate.api.domain.wardmember.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.entity.Ward;
import net.dutymate.api.global.entity.WardMember;

@Repository
public interface WardMemberRepository extends JpaRepository<WardMember, Long> {

	Boolean existsByMember(Member member);

	WardMember findByMember(Member member);

	List<WardMember> findAllByWard(Ward ward);

	List<WardMember> findByWardAndIsSynced(Ward ward, Boolean isSynced);

	Boolean existsByWard(Ward ward);

}
