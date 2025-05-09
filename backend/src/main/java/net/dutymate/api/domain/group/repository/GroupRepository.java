package net.dutymate.api.domain.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.group.NurseGroup;

@Repository
public interface GroupRepository extends JpaRepository<NurseGroup, Long> {


}
