package net.dutymate.api.domain.wardmember.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.wardmember.dto.NurseInfoRequestDto;
import net.dutymate.api.domain.wardmember.service.WardMemberService;
import net.dutymate.api.global.auth.annotation.Auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ward")
@RequiredArgsConstructor
public class WardMemberController {

	private final WardMemberService wardMemberService;

	// 간호사 정보 수정하기
	@PutMapping("/member/{memberId}")
	public ResponseEntity<?> updateWardMemberInfo(@PathVariable Long memberId,
		@Valid @RequestBody NurseInfoRequestDto nurseInfoRequestDto, @Auth Member member) {

		wardMemberService.updateWardMember(memberId, nurseInfoRequestDto, member);
		return ResponseEntity.ok().build();
	}

	// 병동 간호사 내보내기
	@DeleteMapping("/member")
	public ResponseEntity<?> deleteWardMemberInfo(@RequestParam List<Long> memberIds, @Auth Member member) {
		wardMemberService.deleteWardMember(memberIds, member);
		return ResponseEntity.ok().build();
	}
}
