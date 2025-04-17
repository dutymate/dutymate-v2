package net.dutymate.api.ward.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dutymate.api.entity.Hospital;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

	List<Hospital> findByHospitalNameContaining(String hospitalName, Pageable pageable);
}
