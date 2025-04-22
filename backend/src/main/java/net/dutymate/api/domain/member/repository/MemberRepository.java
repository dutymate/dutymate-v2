package net.dutymate.api.domain.member.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

	Optional<Member> findMemberByEmail(String email);

	Boolean existsByNickname(String nickname);

	Boolean existsByEmail(String email);

	List<Member> findByEmailEndingWith(String suffix);
}
