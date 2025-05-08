package net.dutymate.api.domain.request.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.RequestStatus;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.wardmember.WardMember;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

	List<Request> findAllByWardMember(WardMember wardMember);

	@Query("SELECT DISTINCT r FROM Request r "
		+ "LEFT JOIN FETCH r.wardMember wm "
		+ "LEFT JOIN FETCH wm.member m "
		+ "WHERE wm.ward = :ward")
	List<Request> findAllWardRequests(@Param("ward") Ward ward);

	@Query("SELECT r FROM Request r WHERE r.wardMember.ward = :ward "
		+ "AND YEAR(r.requestDate) = :year AND MONTH(r.requestDate) = :month")
	List<Request> findAllWardRequestsByYearMonth(
		@Param("ward") Ward ward,
		@Param("year") Integer year,
		@Param("month") Integer month
	);

	@Query("SELECT r FROM Request r WHERE r.wardMember.ward = :ward AND YEAR(r.requestDate) = :year AND MONTH(r.requestDate) = :month AND r.status = :status")
	List<Request> findAcceptedWardRequestsByYearMonth(
		@Param("ward") Ward ward,
		@Param("year") Integer year,
		@Param("month") Integer month,
		@Param("status") RequestStatus status);
}
