package net.dutymate.api.request.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Request;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

	List<Request> findAllByWardMember(WardMember wardMember);

	@Query("SELECT DISTINCT r FROM Request r "
		+ "LEFT JOIN FETCH r.wardMember wm "
		+ "LEFT JOIN FETCH wm.member m "
		+ "WHERE wm.ward = :ward")
	List<Request> findAllWardRequests(@Param("ward") Ward ward);

}

