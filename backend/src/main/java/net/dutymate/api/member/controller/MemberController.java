package net.dutymate.api.member.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.entity.Member;
import net.dutymate.api.member.dto.AdditionalInfoRequestDto;
import net.dutymate.api.member.dto.AdditionalInfoResponseDto;
import net.dutymate.api.member.dto.CheckNicknameRequestDto;
import net.dutymate.api.member.dto.CheckPasswordDto;
import net.dutymate.api.member.dto.LoginRequestDto;
import net.dutymate.api.member.dto.LoginResponseDto;
import net.dutymate.api.member.dto.MypageEditRequestDto;
import net.dutymate.api.member.dto.MypageResponseDto;
import net.dutymate.api.member.dto.SignUpRequestDto;
import net.dutymate.api.member.service.MemberService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {

	private final MemberService memberService;

	@PostMapping
	public ResponseEntity<?> signUp(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
		LoginResponseDto loginResponseDto = memberService.signUp(signUpRequestDto);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/check-email")
	public ResponseEntity<?> checkEmailDuplicate(@RequestParam String email) {
		memberService.checkEmail(email);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
		LoginResponseDto loginResponseDto = memberService.login(loginRequestDto);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/login/kakao")
	public ResponseEntity<?> kakaoLogin(@RequestParam String code) {
		LoginResponseDto loginResponseDto = memberService.kakaoLogin(code);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/login/google")
	public ResponseEntity<?> googleLogin(@RequestParam String code) {
		LoginResponseDto loginResponseDto = memberService.googleLogin(code);
		return ResponseEntity.ok(loginResponseDto);
	}

	@PostMapping("/info")
	public ResponseEntity<?> addAdditionalInfo(
		@RequestBody AdditionalInfoRequestDto additionalInfoRequestDto,
		@Auth Member member) {
		AdditionalInfoResponseDto additionalInfoResponseDto
			= memberService.addAdditionalInfo(member, additionalInfoRequestDto);
		return ResponseEntity.ok(additionalInfoResponseDto);
	}

	@PostMapping("/logout")
	public ResponseEntity<String> logout(@RequestHeader("Authorization") String bearerToken) {
		memberService.logout(bearerToken);
		return ResponseEntity.ok().build();
	}

	@GetMapping
	public ResponseEntity<?> getMembers(@Auth Member member) {
		MypageResponseDto mypageResponseDto = memberService.getMember(member);
		return ResponseEntity.ok(mypageResponseDto);
	}

	@PutMapping
	public ResponseEntity<?> updateMember(@Auth Member member,
		@Valid @RequestBody MypageEditRequestDto mypageEditRequestDto) {
		memberService.updateMember(member, mypageEditRequestDto);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/check-nickname")
	public ResponseEntity<?> checkNickname(@Auth Member member,
		@Valid @RequestBody CheckNicknameRequestDto checkNicknameRequestDto) {
		memberService.checkNickname(member, checkNicknameRequestDto.getNickname());
		return ResponseEntity.ok().body("사용 가능한 닉네임입니다.");
	}

	@PostMapping("/image")
	public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile multipartFile, @Auth Member member) {
		memberService.uploadProfileImg(multipartFile, member, "profile");
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/image")
	public ResponseEntity<?> deleteImage(@Auth Member member) {
		memberService.deleteProfileImg(member);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/ward")
	public ResponseEntity<?> deleteWardMember(@Auth Member member) {
		memberService.exitWard(member);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping
	public ResponseEntity<?> deleteMember(@Auth Member member) {
		memberService.deleteMember(member);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/password")
	public ResponseEntity<?> checkPassword(@Auth Member member, @RequestBody CheckPasswordDto checkPasswordDto) {
		memberService.checkPassword(member, checkPasswordDto);
		return ResponseEntity.ok().build();
	}

}
