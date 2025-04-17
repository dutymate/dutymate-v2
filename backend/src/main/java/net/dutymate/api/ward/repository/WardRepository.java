package net.dutymate.api.ward.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Ward;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {
	Optional<Ward> findByWardCode(String wardCode);
}
