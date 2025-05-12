package net.dutymate.api.domain.color.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dutymate.api.domain.color.Color;
import net.dutymate.api.domain.member.Member;

public interface ColorRepository extends JpaRepository<Color, Long> {

	boolean existsByMember(Member member);
}
