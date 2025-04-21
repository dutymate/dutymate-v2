package net.dutymate.api.domain.rule.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Rule;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {
}
