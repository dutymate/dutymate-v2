package net.dutymate.api.domain.ward.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.ward.Ward;

import io.lettuce.core.dynamic.annotation.Param;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {
	Optional<Ward> findByWardCode(String wardCode);

	@Query("SELECT DISTINCT w FROM Ward w "
		+ "JOIN FETCH w.wardMemberList wm "
		+ "JOIN FETCH wm.member "
		+ "WHERE w.wardId IN :wardIds")
	List<Ward> findWardsWithMembersByWardIdIn(@Param("wardIds") List<Long> wardIds);
}
