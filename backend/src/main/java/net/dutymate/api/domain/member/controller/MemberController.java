package net.dutymate.api.domain.member.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.EmailVerificationResult;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.dto.AdditionalInfoRequestDto;
import net.dutymate.api.domain.member.dto.AdditionalInfoResponseDto;
import net.dutymate.api.domain.member.dto.CheckNicknameRequestDto;
import net.dutymate.api.domain.member.dto.CheckPasswordDto;
import net.dutymate.api.domain.member.dto.EditRoleRequestDto;
import net.dutymate.api.domain.member.dto.KakaoProfileRequestDto;
import net.dutymate.api.domain.member.dto.LoginRequestDto;
import net.dutymate.api.domain.member.dto.LoginResponseDto;
import net.dutymate.api.domain.member.dto.MypageEditRequestDto;
import net.dutymate.api.domain.member.dto.MypageResponseDto;
import net.dutymate.api.domain.member.dto.PasswordResetRequestDto;
import net.dutymate.api.domain.member.dto.ProfileImgResponseDto;
import net.dutymate.api.domain.member.dto.SendCodeRequestDto;
import net.dutymate.api.domain.member.dto.SignUpRequestDto;
import net.dutymate.api.domain.member.dto.UpdateEmailVerificationRequestDto;
import net.dutymate.api.domain.member.dto.VerifyCodeRequestDto;
import net.dutymate.api.domain.member.service.EmailService;
import net.dutymate.api.domain.member.service.MemberService;
import net.dutymate.api.global.auth.annotation.Auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {

	private final MemberService memberService;
	private final EmailService emailService;

	@Value("${api.secret.key}")
	private String apiDemoSecret;

	@PostMapping
	public ResponseEntity<?> signUp(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
		LoginResponseDto loginResponseDto = memberService.signUp(signUpRequestDto, false);
		return ResponseEntity.ok(loginResponseDto);
	}

	@PostMapping("/mobile")
	public ResponseEntity<?> signUpMobile(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
		LoginResponseDto loginResponseDto = memberService.signUp(signUpRequestDto, true);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/check-email")
	public ResponseEntity<?> checkEmailDuplicate(@RequestParam String email) {
		memberService.checkEmail(email);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
		LoginResponseDto loginResponseDto = memberService.login(loginRequestDto, false);
		return ResponseEntity.ok(loginResponseDto);
	}

	@PostMapping("/login/mobile")
	public ResponseEntity<?> loginMobile(@Valid @RequestBody LoginRequestDto loginRequestDto) {
		LoginResponseDto loginResponseDto = memberService.login(loginRequestDto, true);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/login/kakao")
	public ResponseEntity<?> kakaoLogin(@RequestParam String code) {
		LoginResponseDto loginResponseDto = memberService.kakaoLogin(code);
		return ResponseEntity.ok(loginResponseDto);
	}

	@PostMapping("/login/kakao/mobile")
	public ResponseEntity<?> kakaoLoginMobile(@RequestBody KakaoProfileRequestDto profileRequestDto) {

		// 모바일에서 직접 전달받은 사용자 정보로 로그인 처리
		LoginResponseDto loginResponseDto = memberService.kakaoLoginMobile(profileRequestDto);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/login/google")
	public ResponseEntity<?> googleLogin(@RequestParam String code) {
		LoginResponseDto loginResponseDto = memberService.googleLogin(code, false);
		return ResponseEntity.ok(loginResponseDto);
	}

	@GetMapping("/login/google/mobile")
	public ResponseEntity<?> googleLoginMobile(@RequestParam String code) {
		LoginResponseDto loginResponseDto = memberService.googleLogin(code, true);
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
	public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile multipartFile, @Auth Member member) {
		ProfileImgResponseDto profileImgResponseDto = memberService.uploadProfileImg(multipartFile, member);
		return ResponseEntity.ok(profileImgResponseDto);
	}

	@DeleteMapping("/image")
	public ResponseEntity<?> deleteImage(@Auth Member member) {
		ProfileImgResponseDto profileImgResponseDto = memberService.deleteProfileImg(member);
		return ResponseEntity.ok(profileImgResponseDto);
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

	@PostMapping("/login/demo")
	public ResponseEntity<?> demoLogin() {
		LoginResponseDto loginResponseDto = memberService.demoLogin();
		return ResponseEntity.ok(loginResponseDto);
	}

	@DeleteMapping("/demo")
	public ResponseEntity<?> deleteDemoMember(@RequestHeader(value = "X-API-KEY", required = false) String apiKey) {
		if (apiKey == null || !apiKey.equals(apiDemoSecret)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid API Key");
		}
		memberService.deleteDemoMember();
		return ResponseEntity.ok().build();
	}

	@PostMapping("/email-verification")
	public ResponseEntity<?> sendCodeToEmail(@RequestBody SendCodeRequestDto sendCodeRequestDto,
		@RequestParam String path) {
		emailService.sendCode(sendCodeRequestDto, path);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/email-verification/confirm")
	public ResponseEntity<?> sendCodeToEmailConfirm(@RequestBody VerifyCodeRequestDto verifyCodeRequestDto) {
		EmailVerificationResult result = emailService.verifyCode(verifyCodeRequestDto);

		return switch (result) {
			case SUCCESS -> ResponseEntity.ok().build();
			case CODE_EXPIRED -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "만료된 인증 코드입니다.");
			case CODE_INVALID -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 코드가 일치하지 않습니다");
		};
	}

	@PutMapping("/email-verification/{memberId}")
	public ResponseEntity<?> updateVerifiedEmail(@PathVariable Long memberId,
		@RequestBody UpdateEmailVerificationRequestDto updateEmailVerificationRequestDto) {
		memberService.verifyAndUpdateEmail(memberId, updateEmailVerificationRequestDto);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/password/reset")
	public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequestDto passwordResetRequestDto) {
		emailService.resetPassword(passwordResetRequestDto);
		return ResponseEntity.ok().body("비밀번호가 성공적으로 변경되었습니다.");
	}

	@GetMapping("/enter-waiting-status")
	public ResponseEntity<Boolean> enterWaitingStatus(@Auth Member member) {
		boolean isWaiting = memberService.getEnterWaitingStatus(member);
		return ResponseEntity.ok(isWaiting);
	}

	@GetMapping("/exist-ward-status")
	public ResponseEntity<Boolean> existMyWardStatus(@Auth Member member) {
		boolean isExistWard = memberService.getExistMyWard(member);
		return ResponseEntity.ok(isExistWard);
	}

	@DeleteMapping("/cancel-enter")
	public ResponseEntity<?> cancelEnterWaiting(@Auth Member member) {
		memberService.deleteEnteringWardWaiting(member);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/role")
	public ResponseEntity<?> updateRole(@Auth Member member, @RequestBody EditRoleRequestDto editRoleRequestDto) {
		memberService.updateRole(member, editRoleRequestDto);
		return ResponseEntity.ok().build();
	}
}
