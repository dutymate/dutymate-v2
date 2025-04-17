package net.dutymate.api.ward.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.entity.Member;
import net.dutymate.api.ward.dto.AddNurseCntRequestDto;
import net.dutymate.api.ward.dto.EnterWaitingResponseDto;
import net.dutymate.api.ward.dto.HospitalNameResponseDto;
import net.dutymate.api.ward.dto.TempLinkRequestDto;
import net.dutymate.api.ward.dto.TempNurseResponseDto;
import net.dutymate.api.ward.dto.VirtualEditRequestDto;
import net.dutymate.api.ward.dto.WardInfoResponseDto;
import net.dutymate.api.ward.dto.WardRequestDto;
import net.dutymate.api.ward.service.WardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ward")
@RequiredArgsConstructor
public class WardController {

	private final WardService wardService;

	// 병동 생성하기 (관리자)
	@PostMapping
	public ResponseEntity<?> addWard(@Valid @RequestBody WardRequestDto requestWardDto, @Auth Member member) {
		wardService.createWard(requestWardDto, member);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	// 병동 입장하기 (멤버) : 유효한 코드인지 체크
	@GetMapping("/check-code")
	public ResponseEntity<?> checkCode(@RequestParam String code, @Auth Member member) {
		wardService.addToEnterWaiting(code, member);
		return ResponseEntity.status(HttpStatus.OK).build();
	}

	// 병동 정보 조회하기 (관리자)
	@GetMapping
	public ResponseEntity<?> getWards(@Auth Member member) {
		WardInfoResponseDto wardInfoResponseDto = wardService.getWardInfo(member);
		return ResponseEntity.ok(wardInfoResponseDto);
	}

	// 가상 간호사 추가 (관리자)
	@PostMapping("/member/virtual")
	public ResponseEntity<?> addVirtualMember(@Valid @RequestBody AddNurseCntRequestDto addNurseCntRequestDto,
		@Auth Member member) {
		wardService.addVirtualMember(addNurseCntRequestDto, member);
		return ResponseEntity.ok().build();
	}

	// 임시 간호사 정보 수정 (관리자)
	@PutMapping("/member/virtual/{memberId}")
	public ResponseEntity<?> changeVirtualMember(
		@PathVariable Long memberId,
		@Valid @RequestBody VirtualEditRequestDto virtualEditRequestDto,
		@Auth Member member) {
		wardService.changeVirtualMember(memberId, virtualEditRequestDto, member);
		return ResponseEntity.ok().build();
	}

	// 병원 이름 검색하기
	@GetMapping("/hospital")
	public ResponseEntity<?> getHospital(@RequestParam String name) {
		List<HospitalNameResponseDto> hospitalNameResponseDto = wardService.findHospitalName(name);
		return ResponseEntity.ok(hospitalNameResponseDto);
	}

	// 병동 입장 요청 내역 조회 (관리자) : 입장 관리
	@GetMapping("/enter")
	public ResponseEntity<?> getEnterWaitingList(@Auth Member member) {
		List<EnterWaitingResponseDto> enterWaitingResponseDtoList
			= wardService.getEnterWaitingList(member);
		return ResponseEntity.ok(enterWaitingResponseDtoList);
	}

	// 병동 임시 간호사 목록 조회 (관리자) : 입장 관리
	@GetMapping("/member/temp")
	public ResponseEntity<?> getTempNurseList(@Auth Member member) {
		List<TempNurseResponseDto> tempNurseResponseDtoList
			= wardService.getTempNuserList(member);
		return ResponseEntity.ok(tempNurseResponseDtoList);
	}

	// 병동 입장 승인 (연동하지 않고 추가) (관리자) : 입장 관리
	@PostMapping("/member/{memberId}")
	public ResponseEntity<?> enterAcceptWithoutLink(
		@PathVariable Long memberId,
		@Auth Member member
	) {
		wardService.enterAcceptWithoutLink(memberId, member);
		return ResponseEntity.ok().build();
	}

	// 병동 입장 승인 (연동하고 추가) (관리자) : 입장 관리
	@PostMapping("/member/{memberId}/link")
	public ResponseEntity<?> enterAcceptWithLink(
		@PathVariable Long memberId,
		@RequestBody TempLinkRequestDto tempLinkRequestDto,
		@Auth Member member
	) {
		wardService.enterAcceptWithLink(memberId, tempLinkRequestDto, member);
		return ResponseEntity.ok().build();
	}

	// 병동 입장 거절 (관리자) : 입장 관리
	@PostMapping("/member/{memberId}/denied")
	public ResponseEntity<?> enterDenied(
		@PathVariable Long memberId,
		// @RequestBody EnterManagementRequestDto enterManagementRequestDto,
		@Auth Member member) {
		wardService.enterDenied(memberId, member);
		return ResponseEntity.ok().build();
	}
}
