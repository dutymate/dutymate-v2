package net.dutymate.api.request.service;

import java.util.Calendar;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Request;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.enumclass.RequestStatus;
import net.dutymate.api.enumclass.Shift;
import net.dutymate.api.member.repository.MemberRepository;
import net.dutymate.api.request.dto.EditRequestStatusRequestDto;
import net.dutymate.api.request.dto.MyRequestResponseDto;
import net.dutymate.api.request.dto.RequestCreateDto;
import net.dutymate.api.request.dto.WardRequestResponseDto;
import net.dutymate.api.request.repository.RequestRepository;
import net.dutymate.api.wardschedules.util.ShiftUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RequestService {

	private final RequestRepository requestRepository;
	private final MemberRepository memberRepository;
	private final ShiftUtil shiftUtil;

	@Transactional
	public void createRequest(RequestCreateDto requestCreateDto, Member member) {
		Request request = requestCreateDto.toRequest(member);
		requestRepository.save(request);
	}

	@Transactional
	public List<MyRequestResponseDto> readMyRequest(Member member) {
		return requestRepository.findAllByWardMember(member.getWardMember())
			.stream()
			.map(MyRequestResponseDto::of)
			.toList();
	}

	@Transactional
	public List<WardRequestResponseDto> readWardRequest(Member member) {
		if (!String.valueOf(member.getRole()).equals("HN")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자만 접근할 수 있는 요청입니다.");
		}
		Ward myWard = member.getWardMember().getWard();
		return requestRepository.findAllWardRequests(myWard)
			.stream()
			.map(WardRequestResponseDto::of)
			.toList();
	}

	@Transactional
	public void editRequestStatus(
		Member member, Long requestId, EditRequestStatusRequestDto editRequestStatusRequestDto) {
		// 요청 엔티티 불러오기
		Request request = requestRepository.findById(requestId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 요청입니다."));

		// 기존 상태 및 새로운 상태 불러오기
		RequestStatus prevStatus = request.getStatus();
		RequestStatus changedStatus = RequestStatus.valueOf(editRequestStatusRequestDto.getStatus());

		// 기존 상태 == 새로운 상태 -> 아무 동작도 하지 않음
		if (prevStatus == changedStatus) {
			return;
		}

		// 수간호사의 병동과 요청한 간호사의 병동이 다르면 예외 처리
		if (member.getWardMember().getWard() != request.getWardMember().getWard()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 병동의 요청이 아닙니다.");
		}

		// 요청 상태 변경
		request.changeStatus(changedStatus);

		// 요청한 멤버 불러오기
		Member requestMember = memberRepository.findById(editRequestStatusRequestDto.getMemberId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원을 찾을 수 없습니다."));

		// java.util.Date -> year, month, date 구하기
		Calendar cal = Calendar.getInstance();
		cal.setTime(request.getRequestDate());
		int year = cal.get(Calendar.YEAR);
		int month = cal.get(Calendar.MONTH) + 1; // 0-11이므로 +1 필요
		int date = cal.get(Calendar.DAY_OF_MONTH);

		// 기존 칸 Shift 확인
		Shift prevShift = shiftUtil.getShift(year, month, date, requestMember);

		//      IF) 승인 						 THEN) 무조건 요청 내용대로 듀티표 업데이트
		// ELSE IF) 기존 칸 Shift == 요청 Shift	 THEN) X로 변경
		if (changedStatus == RequestStatus.ACCEPTED && prevShift != request.getRequestShift()) {
			shiftUtil.changeShift(year, month, date, requestMember, prevShift, request.getRequestShift());

		} else if (prevShift == request.getRequestShift()) {
			shiftUtil.changeShift(year, month, date, requestMember, prevShift, Shift.X);
		}
	}
}
