package net.dutymate.api.domain.group.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.group.GroupMember;
import net.dutymate.api.domain.member.Member;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
	Optional<GroupMember> findByGroup_GroupIdAndMember(Long groupId, Member member);

	List<GroupMember> findByMember(Member member);

	Optional<GroupMember> findByGroup_GroupIdAndMember_MemberId(Long groupId, Long memberId);
}
