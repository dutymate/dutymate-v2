package net.dutymate.api.domain.wardmember.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.wardmember.WardMember;

@Repository
public interface WardMemberRepository extends JpaRepository<WardMember, Long> {

	Boolean existsByMember(Member member);

	WardMember findByMember(Member member);

	List<WardMember> findAllByWard(Ward ward);

	List<WardMember> findByWardAndIsSynced(Ward ward, Boolean isSynced);

	Boolean existsByWard(Ward ward);

}
