package net.dutymate.api.rule.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Rule;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {
}
