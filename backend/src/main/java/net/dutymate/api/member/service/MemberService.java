package net.dutymate.api.member.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.Ward;
import net.dutymate.api.entity.WardMember;
import net.dutymate.api.enumclass.Gender;
import net.dutymate.api.enumclass.Provider;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.member.dto.AdditionalInfoRequestDto;
import net.dutymate.api.member.dto.AdditionalInfoResponseDto;
import net.dutymate.api.member.dto.CheckPasswordDto;
import net.dutymate.api.member.dto.GoogleTokenResponseDto;
import net.dutymate.api.member.dto.GoogleUserResponseDto;
import net.dutymate.api.member.dto.KakaoTokenResponseDto;
import net.dutymate.api.member.dto.KakaoUserResponseDto;
import net.dutymate.api.member.dto.LoginRequestDto;
import net.dutymate.api.member.dto.LoginResponseDto;
import net.dutymate.api.member.dto.MypageEditRequestDto;
import net.dutymate.api.member.dto.MypageResponseDto;
import net.dutymate.api.member.dto.ProfileImgResponseDto;
import net.dutymate.api.member.dto.SignUpRequestDto;
import net.dutymate.api.member.repository.MemberRepository;
import net.dutymate.api.member.util.JwtUtil;
import net.dutymate.api.records.YearMonth;
import net.dutymate.api.ward.repository.EnterWaitingRepository;
import net.dutymate.api.ward.repository.WardRepository;
import net.dutymate.api.wardmember.repository.WardMemberRepository;
import net.dutymate.api.wardmember.service.WardMemberService;
import net.dutymate.api.wardschedules.collections.WardSchedule;
import net.dutymate.api.wardschedules.repository.WardScheduleRepository;

import io.netty.handler.codec.http.HttpHeaderValues;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final JwtUtil jwtUtil;
	private final WardMemberRepository wardMemberRepository;
	private final S3Client s3Client;
	private final WardScheduleRepository wardScheduleRepository;
	private final WardMemberService wardMemberService;
	private final EnterWaitingRepository enterWaitingRepository;
	private final WardRepository wardRepository;

	@Value("${kakao.client.id}")
	private String kakaoClientId;
	@Value("${kakao.token.uri}")
	private String kakaoTokenUri;
	@Value("${kakao.user.uri}")
	private String kakaoUserUri;
	@Value("${kakao.redirect.uri}")
	private String kakaoRedirectUri;

	@Value("${google.client.id}")
	private String googleClientId;
	@Value("${google.client.secret}")
	private String googleClientSecret;
	@Value("${google.token.uri}")
	private String googleTokenUri;
	@Value("${google.user.uri}")
	private String googleUserUri;
	@Value("${google.redirect.uri}")
	private String googleRedirectUri;

	@Value("${cloud.aws.region.static}")
	private String region;
	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	@Transactional
	public LoginResponseDto signUp(SignUpRequestDto signUpRequestDto) {
		if (!signUpRequestDto.getPassword().equals(signUpRequestDto.getPasswordConfirm())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
		}

		// 이메일 중복 체크
		checkEmail(signUpRequestDto.getEmail());

		Member newMember = signUpRequestDto.toMember(addBasicProfileImgUrl());

		memberRepository.save(newMember);
		return login(signUpRequestDto.toLoginRequestDto());
	}

	// 회원가입 시, 이메일 중복 체크
	public void checkEmail(String email) {
		boolean isExistedEmail = memberRepository.existsByEmail(email);

		if (isExistedEmail) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 회원가입된 사용자입니다.");
		}
	}

	@Transactional(readOnly = true)
	public LoginResponseDto login(LoginRequestDto loginRequestDto) {
		// 아이디 확인
		Member member = memberRepository.findMemberByEmail(loginRequestDto.getEmail())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호 오류입니다."));

		// 만약 소셜 로그인한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.NONE);

		// 비밀번호 확인
		if (!BCrypt.checkpw(loginRequestDto.getPassword(), member.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호 오류입니다.");
		}

		// memberId로 AccessToken 생성
		String accessToken = jwtUtil.createToken(member.getMemberId());

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode);
	}

	@Transactional
	public LoginResponseDto kakaoLogin(String code) {
		// KAKAO로부터 토큰 발급받아 유저 정보 확인
		String kakaoAccessToken = getKakaoAccessToken(code);
		KakaoUserResponseDto.KakaoAccount kakaoAccount = getKakaoUserInfo(kakaoAccessToken);

		// 가입된 회원 엔티티를 조회. 회원 테이블에 없으면 회원가입 처리
		Member member = memberRepository.findMemberByEmail(kakaoAccount.getEmail())
			.orElseGet(() -> signUp(kakaoAccount));

		// 만약 다른 경로(일반 이메일, GOOGLE) 회원가입한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.KAKAO);

		// memberId로 AccessToken 생성
		String accessToken = jwtUtil.createToken(member.getMemberId());

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode);
	}

	@Transactional
	public LoginResponseDto googleLogin(String code) {
		// GOOGLE로부터 토큰 발급받아 유저 정보 확인
		String googleIdToken = getGoogleIdToken(code);
		GoogleUserResponseDto googleUserInfo = getGoogleUserInfo(googleIdToken);

		// 가입된 회원 엔티티를 조회. 회원 테이블에 없으면 회원가입 처리
		Member member = memberRepository.findMemberByEmail(googleUserInfo.getEmail())
			.orElseGet(() -> signUp(googleUserInfo));

		// 만약 다른 경로(일반 이메일, KAKAO) 회원가입한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.GOOGLE);

		// memberId로 AccessToken 생성
		String accessToken = jwtUtil.createToken(member.getMemberId());

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode);
	}

	@Transactional
	public AdditionalInfoResponseDto addAdditionalInfo(Member member,
		AdditionalInfoRequestDto additionalInfoRequestDto) {
		// DTO -> 연차, 성별, 역할 가져오기
		Integer grade = additionalInfoRequestDto.getGrade();
		Gender gender = Gender.valueOf(additionalInfoRequestDto.getGender());
		Role role = Role.valueOf(additionalInfoRequestDto.getRole());

		// Member 엔티티 수정하기
		member.changeAdditionalInfo(grade, gender, role);
		return AdditionalInfoResponseDto.of(member);
	}

	private void checkAnotherSocialLogin(Member member, Provider loginProvider) {
		if (!member.getProvider().equals(loginProvider)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 다른 경로로 가입한 회원입니다.");
		}
	}

	// 인가 코드로 KAKAO로부터 액세스 토큰을 받아오는 메서드

	private String getKakaoAccessToken(String code) {
		// 요청 Param 설정
		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", kakaoClientId);
		params.add("redirect_uri", kakaoRedirectUri);
		params.add("code", code);

		// WebClient 인스턴스 생성 후 토큰 받기 POST 요청
		KakaoTokenResponseDto kakaoTokenResponseDto =
			requestApiByPost(kakaoTokenUri, params, KakaoTokenResponseDto.class);
		return Objects.requireNonNull(kakaoTokenResponseDto).getAccessToken();
	}
	// 액세스 토큰으로 KAKAO로부터 사용자 정보를 가져오는 메서드

	public KakaoUserResponseDto.KakaoAccount getKakaoUserInfo(String kakaoAccessToken) {
		// WebClient 인스턴스 생성 후 사용자 정보 가져오기 POST 요청
		KakaoUserResponseDto kakaoUserResponseDto
			= requestApiByPostWithAuthHeader(
			kakaoUserUri + "?secure_resource=true", kakaoAccessToken, KakaoUserResponseDto.class);
		return Objects.requireNonNull(kakaoUserResponseDto).getKakaoAccount();
	}

	private String getGoogleIdToken(String code) {
		// 요청 Param 설정
		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", googleClientId);
		params.add("client_secret", googleClientSecret);
		params.add("redirect_uri", googleRedirectUri);
		params.add("code", code);

		// WebClient 인스턴스 생성 후 토큰 받기 POST 요청
		return requestApiByPost(googleTokenUri, params, GoogleTokenResponseDto.class).getIdToken();
	}

	private GoogleUserResponseDto getGoogleUserInfo(String googleIdToken) {
		// 요청 param 설정
		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("id_token", googleIdToken);

		// WebClient 인스턴스 생성 후 사용자 정보 가져오기 POST 요청
		return requestApiByPost(googleUserUri, params, GoogleUserResponseDto.class);
	}

	// KAKAO 계정으로 회원가입
	private Member signUp(KakaoUserResponseDto.KakaoAccount kakaoAccount) {
		Member newMember = kakaoAccount.toMember(addBasicProfileImgUrl());
		memberRepository.save(newMember);
		return newMember;
	}

	// GOOGLE 계정으로 회원가입
	private Member signUp(GoogleUserResponseDto googleUserInfo) {
		Member newMember = googleUserInfo.toMember(addBasicProfileImgUrl());
		memberRepository.save(newMember);
		return newMember;
	}
	// API POST 요청 with params

	private <T> T requestApiByPost(
		String uri, MultiValueMap<String, String> params, Class<T> classType) {
		return WebClient.create().post()
			.uri(uri)
			.header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
			.body(BodyInserters.fromFormData(params))
			.retrieve()
			.bodyToMono(classType)
			.block();
	}
	// API POST 요청 with params, header

	private <T> T requestApiByPostWithAuthHeader(String uri, String token, Class<T> classType) {
		return WebClient.create().get()
			.uri(uri)
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
			.header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
			.retrieve()
			.bodyToMono(classType)
			.block();
	}

	public void logout(String bearerToken) {
		String token = jwtUtil.resolveToken(bearerToken);
		// 토큰 유효기간이 남아있으면 블랙리스트에 추가
		long remainingTime = jwtUtil.getRemainingTime(token);
		if (remainingTime > 0) {
			jwtUtil.addToBlacklist(token, remainingTime);
		}
	}

	public Member getMemberById(Long memberId) {
		return memberRepository.findById(memberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원을 찾을 수 없습니다."));
	}

	// 마이페이지 정보 조회하기

	@Transactional(readOnly = true)
	public MypageResponseDto getMember(Member member) {
		WardMember wardMember = getMemberById(member.getMemberId()).getWardMember();
		return MypageResponseDto.of(wardMember, member);
	}

	@Transactional
	public void updateMember(Member member, MypageEditRequestDto mypageEditRequestDto) {

		String name = mypageEditRequestDto.getName();
		String nickname = mypageEditRequestDto.getNickname();
		String gender = mypageEditRequestDto.getGender();
		Integer grade = mypageEditRequestDto.getGrade();

		// 닉네임이 변경되었을 경우만 중복 체크
		if (nickname != null && !nickname.equals(member.getNickname())) {
			validateNickname(nickname);
		}

		member.editMember(name, nickname, gender, grade);
		memberRepository.save(member);
	}

	public void validateNickname(String nickname) {
		boolean isExisted = memberRepository.existsByNickname(nickname);
		if (isExisted) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "중복된 닉네임이 존재합니다.");
		}
	}

	@Transactional
	public void checkNickname(Member member, String nickname) {
		if (member.getNickname().equals(nickname)) {
			return;
		}
		validateNickname(nickname);
	}

	// 파일 업로드
	@Transactional
	public ProfileImgResponseDto uploadProfileImg(MultipartFile multipartFile, Member member, String dirName) {

		if (multipartFile == null || multipartFile.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
		}

		String fileName = createFileName(multipartFile.getOriginalFilename(), dirName);

		try {

			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucket)
				.key(fileName)
				.contentType(multipartFile.getContentType())
				.build();

			// InputStream을 사용하여 메모리 사용량 최소화
			s3Client.putObject(putObjectRequest,
				RequestBody.fromInputStream(multipartFile.getInputStream(), multipartFile.getSize()));

			String fileUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + fileName;

			member.setFileUrl(fileUrl);

			return ProfileImgResponseDto.of(fileUrl);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 업로드 중 오류가 발생했습니다.");
		}
	}

	// 파일명을 난수화하기 위해 UUID 활용
	private String createFileName(String fileName, String dirName) {
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String extension = getFileExtension(fileName);
		return dirName + "/" + uuid + extension;
	}

	private String getFileExtension(String fileName) {
		if (fileName == null || !fileName.contains(".")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일입니다.");
		}
		return fileName.substring(fileName.lastIndexOf("."));
	}

	// 프로필 이미지 삭제 -> 기본 이미지로 변경
	@Transactional
	public ProfileImgResponseDto deleteProfileImg(Member member) {
		try {
			String fileUrl = member.getProfileImg();
			String fileName = extractFileNameFromUrl(fileUrl);

			if (fileName.equals("default_profile.png")) {
				return ProfileImgResponseDto.of(addBasicProfileImgUrl());
			}

			DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
				.bucket(bucket)
				.key(fileName)
				.build();

			s3Client.deleteObject(deleteObjectRequest);

			member.setFileUrl(addBasicProfileImgUrl());
			memberRepository.save(member);

			return ProfileImgResponseDto.of(addBasicProfileImgUrl());
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 이미지 삭제 중 오류 발생");
		}
	}

	private String extractFileNameFromUrl(String fileUrl) {
		String baseUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/profile/";
		return fileUrl.replace(baseUrl, "");
	}

	// 기본 프로필 이미지 URL 생성
	public String addBasicProfileImgUrl() {
		return "https://" + bucket + ".s3." + region + ".amazonaws.com/profile/default_profile.png";
	}

	@Transactional
	public void exitWard(Member member) {
		Ward ward = member.getWardMember().getWard();

		WardMember wardMember = member.getWardMember();

		if (member.getRole() == Role.RN) {
			ward.removeWardMember(wardMember);
			deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
			return;
		}

		if (member.getRole() == Role.HN) {
			List<WardMember> wardMemberList = wardMemberRepository.findAllByWard(ward);

			if (wardMemberList.size() > 1) {
				boolean hasOtherHN = wardMemberList.stream()
					.anyMatch(wm -> !wm.getMember().getMemberId().equals(member.getMemberId())
						&& wm.getMember().getRole() == Role.HN);

				if (!hasOtherHN) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 관리자 권한을 넘겨주세요.");
				}

				ward.removeWardMember(wardMember);
				deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
				member.updateRole(null);
				return;
			}

			ward.removeWardMember(wardMember);
			deleteWardMemberInMongo(member, ward);
			member.updateRole(null);

			wardRepository.delete(ward);
		}
	}

	// 회원 탈퇴하기
	@Transactional
	public void deleteMember(Member member) {

		Ward ward = member.getWardMember().getWard();

		// RN이면 바로 회원 탈퇴 가능
		if (member.getRole() == Role.RN) {
			if (member.getWardMember() != null) {
				ward.removeWardMember(member.getWardMember());
			}
			memberRepository.delete(member);
			deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
			return;
		}

		if (member.getRole() == Role.HN) {
			List<WardMember> wardMemberList = wardMemberRepository.findAllByWard(ward);

			if (wardMemberList.size() > 1) {
				// 병동 내 다른 HN이 있는지 확인
				boolean hasOtherHN = wardMemberList.stream()
					.anyMatch(wardMember ->
						!wardMember.getMember().getMemberId().equals(member.getMemberId())
							&& wardMember.getMember().getRole() == Role.HN);

				if (!hasOtherHN) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 멤버에게 관리자 권한 부여 후, 탈퇴가 가능합니다.");
				}

				ward.removeWardMember(member.getWardMember());
				memberRepository.delete(member);
				deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
				return;
			}

			// 병동에 한 명만 남아 있는 경우
			if (member.getWardMember() != null) {
				ward.removeWardMember(member.getWardMember()); // 병동에서 마지막 관리자 삭제
				wardRepository.delete(ward); // 해당 병동도 같이 삭제
			}
			memberRepository.delete(member); // 멤버 자체를 삭제
			deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
		}
	}

	// MongoDB 에서 내보내는 wardmember 찾아서 삭제 (이전 달은 상관 X)
	public void deleteWardMemberInMongo(Member member, Ward ward) {

		// 이번달 듀티에서 삭제
		YearMonth yearMonth = YearMonth.nowYearMonth();

		WardSchedule currMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			ward.getWardId(), yearMonth.year(), yearMonth.month()).orElse(null);

		if (currMonthSchedule != null) {
			wardMemberService.deleteWardMemberDuty(currMonthSchedule, member);
		}

		// 다음달 듀티에서 삭제
		YearMonth nextYearMonth = yearMonth.nextYearMonth();

		WardSchedule nextMonthSchedule = wardScheduleRepository.findByWardIdAndYearAndMonth(
			ward.getWardId(), nextYearMonth.year(), nextYearMonth.month()).orElse(null);

		if (nextMonthSchedule != null) {
			wardMemberService.deleteWardMemberDuty(nextMonthSchedule, member);
		}

	}

	public void checkPassword(Member member, CheckPasswordDto checkPasswordDto) {
		// 1. 만약 소셜 로그인한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.NONE);

		// 2. 현재 비밀번호 확인 (DB에 저장된 암호화된 비밀번호와 일치하는지 확인)
		if (!BCrypt.checkpw(checkPasswordDto.getCurrentPassword(), member.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다.");
		}

		// 3. 새 비밀번호와 비밀번호 확인 값이 같은지 확인
		if (!checkPasswordDto.getNewPassword().equals(checkPasswordDto.getNewPasswordConfirm())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "새 비밀번호가 일치하지 않습니다.");
		}

		// 4. 새 비밀번호 암호화하여 저장하기
		member.updatePassword(checkPasswordDto.getNewPassword());
		memberRepository.save(member);
	}

	// @Transactional
	// public void deleteWardIfEmpty(Ward ward) {
	// 	if (wardMemberRepository.findAllByWard(ward).isEmpty()) {
	// 		wardRepository.delete(ward);
	// 	}
	// }
}
