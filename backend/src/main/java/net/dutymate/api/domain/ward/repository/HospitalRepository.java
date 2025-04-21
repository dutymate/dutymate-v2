package net.dutymate.api.domain.ward.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dutymate.api.global.entity.Hospital;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

	List<Hospital> findByHospitalNameContaining(String hospitalName, Pageable pageable);
}
