package net.dutymate.api.domain.member.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
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

import net.dutymate.api.domain.color.Color;
import net.dutymate.api.domain.color.repository.ColorRepository;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.member.Gender;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.Provider;
import net.dutymate.api.domain.member.dto.AdditionalInfoRequestDto;
import net.dutymate.api.domain.member.dto.AdditionalInfoResponseDto;
import net.dutymate.api.domain.member.dto.CheckPasswordDto;
import net.dutymate.api.domain.member.dto.EditRoleRequestDto;
import net.dutymate.api.domain.member.dto.GoogleTokenResponseDto;
import net.dutymate.api.domain.member.dto.GoogleUserResponseDto;
import net.dutymate.api.domain.member.dto.KakaoTokenResponseDto;
import net.dutymate.api.domain.member.dto.KakaoUserResponseDto;
import net.dutymate.api.domain.member.dto.LoginLog;
import net.dutymate.api.domain.member.dto.LoginRequestDto;
import net.dutymate.api.domain.member.dto.LoginResponseDto;
import net.dutymate.api.domain.member.dto.MypageEditRequestDto;
import net.dutymate.api.domain.member.dto.MypageResponseDto;
import net.dutymate.api.domain.member.dto.ProfileImgResponseDto;
import net.dutymate.api.domain.member.dto.SignUpRequestDto;
import net.dutymate.api.domain.member.dto.UpdateEmailVerificationRequestDto;
import net.dutymate.api.domain.member.repository.MemberRepository;
import net.dutymate.api.domain.member.util.StringGenerator;
import net.dutymate.api.domain.request.Request;
import net.dutymate.api.domain.request.repository.RequestRepository;
import net.dutymate.api.domain.request.util.DemoRequestGenerator;
import net.dutymate.api.domain.ward.EnterWaiting;
import net.dutymate.api.domain.ward.Ward;
import net.dutymate.api.domain.ward.dto.WardRequestDto;
import net.dutymate.api.domain.ward.repository.EnterWaitingRepository;
import net.dutymate.api.domain.ward.repository.WardRepository;
import net.dutymate.api.domain.wardmember.Role;
import net.dutymate.api.domain.wardmember.ShiftType;
import net.dutymate.api.domain.wardmember.WardMember;
import net.dutymate.api.domain.wardmember.repository.WardMemberRepository;
import net.dutymate.api.domain.wardmember.service.WardMemberService;
import net.dutymate.api.domain.wardschedules.collections.WardSchedule;
import net.dutymate.api.domain.wardschedules.repository.MemberScheduleRepository;
import net.dutymate.api.domain.wardschedules.repository.WardScheduleRepository;
import net.dutymate.api.domain.wardschedules.util.InitialDutyGenerator;
import net.dutymate.api.domain.wardschedules.util.PreviousScheduleGenerator;
import net.dutymate.api.global.auth.jwt.JwtUtil;
import net.dutymate.api.global.exception.EmailNotVerifiedException;

import io.netty.handler.codec.http.HttpHeaderValues;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class MemberService {

	public static final String DEMO_EMAIL_SUFFIX = "@dutymate.demo";
	public static final String TEMP_NURSE_EMAIL = "tempEmail@temp.com";
	private static final String DEMO_MEMBER_PREFIX = "demo:member:";
	private static final String DEMO_PASSWORD = "qwer1234!";
	private static final String DEMO_NAME = "데모계정";
	private static final String DEMO_HOSPITAL_NAME = "듀티메이트병원";
	private static final String DEMO_WARD_NAME = "듀티병동";
	private static final Integer DEMO_TEMP_NURSE_CNT = 10;
	private static final Integer DEMO_AUTO_GEN_CNT = 1;
	private static final Integer DEFAULT_AUTO_GEN_CNT = 1;
	private final MemberRepository memberRepository;
	private final JwtUtil jwtUtil;
	private final WardMemberRepository wardMemberRepository;
	private final S3Client s3Client;
	private final WardScheduleRepository wardScheduleRepository;
	private final WardMemberService wardMemberService;
	private final EnterWaitingRepository enterWaitingRepository;
	private final WardRepository wardRepository;
	private final InitialDutyGenerator initialDutyGenerator;
	private final RedisTemplate<String, String> redisTemplate;
	private final RequestRepository requestRepository;
	private final MemberScheduleRepository memberScheduleRepository;
	private final ColorRepository colorRepository;
	private final LoginLogService loginLogService;

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

	@Value("${jwt.demo-expiration}")
	private long demoExpiration;

	@Transactional
	public LoginResponseDto signUp(SignUpRequestDto signUpRequestDto, boolean isMobile) {
		// 이메일이 @dutymate.demo로 끝나는지 확인
		if (signUpRequestDto.getEmail().toLowerCase().endsWith(MemberService.DEMO_EMAIL_SUFFIX)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 이메일은 사용할 수 없습니다.");
		}

		String verifiedEmail = "email:verified:" + signUpRequestDto.getEmail();
		String isVerified = redisTemplate.opsForValue().get(verifiedEmail);

		if (!("true".equals(isVerified))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일 인증이 완료 되지 않았습니다.");
		}

		if (!signUpRequestDto.getPassword().equals(signUpRequestDto.getPasswordConfirm())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
		}

		// 이메일 중복 체크
		checkEmail(signUpRequestDto.getEmail());

		Member newMember = signUpRequestDto.toMember(addBasicProfileImgUrl());
		newMember.setAutoGenCnt(DEFAULT_AUTO_GEN_CNT);
		memberRepository.save(newMember);

		return login(signUpRequestDto.toLoginRequestDto(), isMobile);
	}

	// 회원가입 시, 이메일 중복 체크
	public void checkEmail(String email) {
		boolean isExistedEmail = memberRepository.existsByEmail(email);

		if (isExistedEmail) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 회원가입된 사용자입니다.");
		}
	}

	@Transactional
	public LoginResponseDto login(LoginRequestDto loginRequestDto, boolean isMobile) {
		// 이메일이 @dutymate.demo로 끝나는지 확인
		if (loginRequestDto.getEmail().toLowerCase().endsWith(MemberService.DEMO_EMAIL_SUFFIX)) {
			loginLogService.pushLoginLog(LoginLog.of(null, false, "데모 계정으로 로그인 시도"));
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호 오류입니다.");
		}

		// 아이디 확인
		Member member = memberRepository.findMemberByEmail(loginRequestDto.getEmail())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호 오류입니다."));

		// 만약 소셜 로그인한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.NONE);

		// 비밀번호 확인
		if (!BCrypt.checkpw(loginRequestDto.getPassword(), member.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호 오류입니다.");
		}

		// 이메일 인증 확인
		if (!member.getIsVerified()) {
			throw new EmailNotVerifiedException("이메일 인증을 진행해주세요.", member.getMemberId());
		}

		// Color 테이블에 아직 값이 없으면 기본 컬러값 저장
		if (!colorRepository.existsByMember(member)) {
			Color defaultColor = Color.of(member);
			member.setColor(defaultColor);
			colorRepository.save(defaultColor);
		}

		// memberId로 AccessToken 생성
		String accessToken;

		if (isMobile) {
			accessToken = jwtUtil.createMobileToken(member.getMemberId());
		} else {
			accessToken = jwtUtil.createToken(member.getMemberId());
		}

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		loginLogService.pushLoginLog(LoginLog.of(member, true, null));

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode, false);
	}

	@Transactional
	public LoginResponseDto kakaoLogin(String code, boolean isMobile) {
		// KAKAO로부터 토큰 발급받아 유저 정보 확인
		String kakaoAccessToken = getKakaoAccessToken(code);
		KakaoUserResponseDto.KakaoAccount kakaoAccount = getKakaoUserInfo(kakaoAccessToken);

		// 가입된 회원 엔티티를 조회. 회원 테이블에 없으면 회원가입 처리
		Member member = memberRepository.findMemberByEmail(kakaoAccount.getEmail())
			.orElseGet(() -> signUp(kakaoAccount));

		// 만약 다른 경로(일반 이메일, GOOGLE) 회원가입한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.KAKAO);

		// Color 테이블에 아직 값이 없으면 기본 컬러값 저장
		if (!colorRepository.existsByMember(member)) {
			Color defaultColor = Color.of(member);
			member.setColor(defaultColor);
			colorRepository.save(defaultColor);
		}

		// memberId로 AccessToken 생성
		String accessToken;

		if (isMobile) {
			accessToken = jwtUtil.createMobileToken(member.getMemberId());
		} else {
			accessToken = jwtUtil.createToken(member.getMemberId());
		}

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		loginLogService.pushLoginLog(LoginLog.of(member, true, null));

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode, false);
	}

	@Transactional
	public LoginResponseDto googleLogin(String code, boolean isMobile) {
		// GOOGLE로부터 토큰 발급받아 유저 정보 확인
		String googleIdToken = getGoogleIdToken(code);
		GoogleUserResponseDto googleUserInfo = getGoogleUserInfo(googleIdToken);

		// 가입된 회원 엔티티를 조회. 회원 테이블에 없으면 회원가입 처리
		Member member = memberRepository.findMemberByEmail(googleUserInfo.getEmail())
			.orElseGet(() -> signUp(googleUserInfo));

		// 만약 다른 경로(일반 이메일, KAKAO) 회원가입한 이력이 있는 경우 예외 처리
		checkAnotherSocialLogin(member, Provider.GOOGLE);

		// memberId로 AccessToken 생성
		String accessToken;

		if (isMobile) {
			accessToken = jwtUtil.createMobileToken(member.getMemberId());
		} else {
			accessToken = jwtUtil.createToken(member.getMemberId());
		}

		// Color 테이블에 아직 값이 없으면 기본 컬러값 저장
		if (!colorRepository.existsByMember(member)) {
			Color defaultColor = Color.of(member);
			member.setColor(defaultColor);
			colorRepository.save(defaultColor);
		}

		boolean existAdditionalInfo =
			member.getGrade() != null && member.getGender() != null && member.getRole() != null;

		boolean existMyWard = wardMemberRepository.existsByMember(member);

		boolean sentWardCode = enterWaitingRepository.existsByMember(member);

		loginLogService.pushLoginLog(LoginLog.of(member, true, null));

		return LoginResponseDto.of(member, accessToken, existAdditionalInfo, existMyWard, sentWardCode, false);
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
		WardMember wardMember = member.getWardMember();
		if (wardMember == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동에 속하지 않은 회원입니다.");
		}

		Ward ward = member.getWardMember().getWard();

		if (member.getRole() == Role.RN) {
			ward.removeWardMember(wardMember);
			deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
			// member.updateRole(null);
			member.clearEnterDate();
			return;
		}

		if (member.getRole() == Role.HN) {
			// HN인 경우 먼저 승인 대기중인 간호사들이 있는지 확인하고 처리
			List<EnterWaiting> enterWaitings = enterWaitingRepository.findByWard(ward);
			if (!enterWaitings.isEmpty()) {
				// 승인 대기중인 간호사들의 신청을 모두 삭제
				enterWaitingRepository.deleteAll(enterWaitings);
			}

			List<WardMember> wardMemberList = wardMemberRepository.findAllByWard(ward);

			if (wardMemberList.size() > 1) {
				boolean hasOtherHN = wardMemberList.stream()
					.anyMatch(wm -> !wm.getMember().getMemberId().equals(member.getMemberId())
						&& wm.getMember().getRole() == Role.HN);

				// 병동 내 다른 유저가 있는지 확인
				boolean hasOtherUser = wardMemberList.stream()
					.anyMatch(wm -> {
						return wm.getMember() != member
							&& !TEMP_NURSE_EMAIL.equals(wm.getMember().getEmail());
					});

				if (hasOtherHN) {
					ward.removeWardMember(member.getWardMember());
					deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
				} else if (hasOtherUser) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 관리자 권한을 넘긴 후 나갈 수 있습니다.");
				} else { // !hasOtherHN && !hasOtherUser => 병동에 임시간호사만 있는 경우
					// 임시 간호사 탈퇴 로직
					for (WardMember wm : wardMemberList) {
						if (member != wm.getMember()) {
							memberRepository.delete(wm.getMember());
						}
					}
					wardScheduleRepository.deleteByWardId(ward.getWardId());
					wardRepository.delete(ward);
				}
				member.updateRole(null);
				member.clearEnterDate();
				return;
			}

			// 병동에 한 명만 남아 있는 경우
			wardScheduleRepository.deleteByWardId(ward.getWardId()); // mongodb에서 삭제
			wardRepository.delete(ward); // 해당 병동도 같이 삭제
			member.updateRole(null);
			member.clearEnterDate();
		}
	}

	// 회원 탈퇴하기
	@Transactional
	public void deleteMember(Member member) {
		// RN이면 바로 회원 탈퇴 가능
		if (member.getRole() == Role.RN) {
			if (member.getWardMember() != null) {
				Ward ward = member.getWardMember().getWard();
				deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
				ward.removeWardMember(member.getWardMember());
			}
			memberRepository.delete(member);
			memberScheduleRepository.deleteByMemberId(member.getMemberId());
			return;
		}

		if (member.getRole() == Role.HN) {
			Ward ward = member.getWardMember().getWard();
			List<WardMember> wardMemberList = wardMemberRepository.findAllByWard(ward);

			if (wardMemberList.size() > 1) {
				// 병동 내 다른 HN이 있는지 확인
				boolean hasOtherHN = wardMemberList.stream()
					.anyMatch(wardMember ->
						!wardMember.getMember().getMemberId().equals(member.getMemberId())
							&& wardMember.getMember().getRole() == Role.HN);

				// 병동 내 다른 유저가 있는지 확인
				boolean hasOtherUser = wardMemberList.stream()
					.anyMatch(wardMember -> {
						return wardMember.getMember() != member
							&& !TEMP_NURSE_EMAIL.equals(wardMember.getMember().getEmail());
					});

				// HN이 있으면 나만 병동에서 삭제
				if (hasOtherHN) {
					ward.removeWardMember(member.getWardMember());
					deleteWardMemberInMongo(member, ward); // mongodb에서 삭제
				} else if (hasOtherUser) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 관리자 권한을 넘긴 후 탈퇴할 수 있습니다.");
				} else { // !hasOtherHN && !hasOtherUser => 병동에 임시간호사만 있는 경우
					// 임시 간호사 탈퇴 로직
					for (WardMember wardMember : wardMemberList) {
						memberRepository.delete(wardMember.getMember());
					}
					wardScheduleRepository.deleteByWardId(ward.getWardId());
					wardRepository.delete(ward);
				}
				memberRepository.delete(member);
				memberScheduleRepository.deleteByMemberId(member.getMemberId());
				return;
			}

			// 병동에 한 명만 남아 있는 경우
			wardScheduleRepository.deleteByWardId(ward.getWardId()); // mongodb에서 삭제
			memberScheduleRepository.deleteByMemberId(member.getMemberId());
			wardRepository.delete(ward); // 해당 병동도 같이 삭제
			memberRepository.delete(member); // 멤버 자체를 삭제
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

	// 인증된 이메일로 업데이트하기
	@Transactional
	public void verifyAndUpdateEmail(Long memberId,
		UpdateEmailVerificationRequestDto updateEmailVerificationRequestDto) {
		// 인증 완료 여부 확인하기
		String redisKey = "email:verified:" + updateEmailVerificationRequestDto.email();
		String verified = redisTemplate.opsForValue().get(redisKey);

		if (!"true".equals(verified)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증이 완료되지 않았습니다.");
		}

		// DB에 업데이트하기
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));

		// 인증된 이메일과 isVerified -> true로 update
		member.updateVerifiedEmail(updateEmailVerificationRequestDto.email());

		// 인증 상태 Redis에서 삭제하기
		redisTemplate.delete(redisKey);
	}

	@Transactional
	public LoginResponseDto demoLogin() {
		SignUpRequestDto signUpRequestDto = SignUpRequestDto.builder()
			.email(StringGenerator.generateRandomString() + DEMO_EMAIL_SUFFIX)
			.password(DEMO_PASSWORD)
			.passwordConfirm(DEMO_PASSWORD)
			.name(DEMO_NAME)
			.autoGenCnt(DEMO_AUTO_GEN_CNT)
			.build();

		// 1. 데모 계정 회원가입
		checkEmail(signUpRequestDto.getEmail());
		Member newMember = signUpRequestDto.toMember(addBasicProfileImgUrl());
		memberRepository.save(newMember);

		// 2. 데모 계정 부가정보 기입
		AdditionalInfoRequestDto additionalInfoRequestDto = AdditionalInfoRequestDto.builder()
			.role("HN").grade(10).gender("F").build();
		addAdditionalInfo(newMember, additionalInfoRequestDto);

		// 3. 데모 병동 생성
		WardRequestDto wardRequestDto = WardRequestDto.builder()
			.hospitalName(DEMO_HOSPITAL_NAME).wardName(DEMO_WARD_NAME).build();
		Ward ward = wardRequestDto.toWard(StringGenerator.generateWardCode());
		wardRepository.save(ward);

		// 4. 데모 WardMember 생성
		WardMember wardMember = WardMember.builder()
			.isSynced(true)
			.ward(ward)
			.member(newMember)
			.build();
		wardMemberRepository.save(wardMember);
		ward.addWardMember(wardMember);

		// 5. 새로운 임시간호사 리스트 생성
		List<Member> newMemberList = new ArrayList<>();
		List<WardMember> newWardMemberList = new ArrayList<>();
		List<Request> newRequestList = new ArrayList<>();

		// 현재 년월 기준으로 요청 생성
		YearMonth currentYearMonth = YearMonth.nowYearMonth();

		for (int tempNurseSeq = 1; tempNurseSeq <= DEMO_TEMP_NURSE_CNT; tempNurseSeq++) {
			String tempNurseName = "간호사" + tempNurseSeq;

			Member tempMember = createTempMember(tempNurseName);
			WardMember tempWardMember = createTempWardMember(ward, tempMember);

			// 5-1. 9번과 10번 간호사는 근무 유형을 Night로 설정
			if (tempNurseSeq == 9 || tempNurseSeq == 10) {
				tempWardMember.changeShiftFlags(ShiftType.N.getFlag());
				addMemberToLists(tempMember, tempWardMember, ward, newMemberList, newWardMemberList);
				continue;
			}

			// DemoRequestGenerator를 사용하여 요청 생성
			List<Request> requests = DemoRequestGenerator.generateRequests(tempWardMember, tempNurseSeq,
				currentYearMonth);
			newRequestList.addAll(requests);

			addMemberToLists(tempMember, tempWardMember, ward, newMemberList, newWardMemberList);
		}

		ward.changeTempNurseSeq(DEMO_TEMP_NURSE_CNT);
		// 6. 임시 간호사 리스트를 RDB에 저장
		memberRepository.saveAll(newMemberList);
		wardMemberRepository.saveAll(newWardMemberList);
		requestRepository.saveAll(newRequestList);

		YearMonth yearMonth = YearMonth.nowYearMonth();

		// 8. 이전 달의 근무 일정 생성 (마지막 4일치)
		YearMonth prevYearMonth = yearMonth.prevYearMonth();
		WardSchedule prevMonthSchedule = PreviousScheduleGenerator.createPreviousMonthSchedule(
			ward, ward.getWardMemberList(), prevYearMonth);
		wardScheduleRepository.save(prevMonthSchedule);
		// 8. 병동 생성하는 멤버의 듀티표 초기화하여 mongodb에 저장하기
		initialDutyGenerator.createNewWardSchedule(ward, ward.getWardMemberList(), yearMonth);

		// 로그인 (토큰 시간 1시간 설정)
		// memberId로 AccessToken 생성
		String accessToken = jwtUtil.create1HourToken(newMember.getMemberId());

		// 레디스에 demo 계정 memberId 삽입
		String key = DEMO_MEMBER_PREFIX + newMember.getMemberId();
		redisTemplate.opsForValue().set(key, "demo", demoExpiration, TimeUnit.MILLISECONDS);

		// Color 테이블에 아직 값이 없으면 기본 컬러값 저장
		Color defaultColor = Color.of(newMember);
		newMember.setColor(defaultColor);
		colorRepository.save(defaultColor);

		return LoginResponseDto.of(newMember, accessToken, true, true, true, true);
	}

	private Member createTempMember(String tempNurseName) {
		return Member.builder()
			.email(TEMP_NURSE_EMAIL)
			.name(tempNurseName)
			.password("tempPassword123!!")
			.grade(1)
			.role(Role.RN)
			.gender(Gender.F)
			.provider(Provider.NONE)
			.profileImg(addBasicProfileImgUrl())
			.autoGenCnt(0)
			.build();
	}

	private WardMember createTempWardMember(Ward ward, Member tempMember) {
		return WardMember.builder()
			.isSynced(false)
			.ward(ward)
			.member(tempMember)
			.build();
	}

	private void addMemberToLists(Member member, WardMember wardMember, Ward ward,
		List<Member> memberList, List<WardMember> wardMemberList) {
		memberList.add(member);
		wardMemberList.add(wardMember);
		ward.addWardMember(wardMember);
	}

	@Transactional
	public void deleteDemoMember() {
		// DEMO_MEMBER_PREFIX로 시작하는 모든 키를 SCAN으로 조회
		ScanOptions options = ScanOptions.scanOptions().match(DEMO_MEMBER_PREFIX + "*").count(1_000).build();

		HashSet<Long> demoMemberIdSet = new HashSet<>();
		try (Cursor<String> cursor = redisTemplate.scan(options)) {
			while (cursor.hasNext()) {
				String memberIdStr = cursor.next();
				Long memberId = Long.parseLong(memberIdStr.substring(memberIdStr.lastIndexOf(":") + 1));
				demoMemberIdSet.add(memberId);
			}
		}

		// 데모계정 불러오기
		List<Member> demoMembers = memberRepository.findByEmailEndingWith(DEMO_EMAIL_SUFFIX);

		List<Long> wardIdsToDelete = new ArrayList<>();

		// demoMemberIdSet에 없는 멤버는 삭제!!
		for (Member demoMember : demoMembers) {
			// 아직 데모 진행중인 경우 (레디스에 존재하는 경우) continue
			if (demoMemberIdSet.contains(demoMember.getMemberId())) {
				continue;
			}

			Ward ward = demoMember.getWardMember().getWard();
			wardIdsToDelete.add(ward.getWardId());
		}

		if (wardIdsToDelete.isEmpty()) {
			return; // 삭제할 게 없으면 끝
		}

		// Ward + WardMember + Member를 fetch join으로 한 번에 가져오기
		List<Ward> wards = wardRepository.findWardsWithMembersByWardIdIn(wardIdsToDelete);

		List<Member> membersToDelete = new ArrayList<>();
		for (Ward ward : wards) {
			for (WardMember wardMember : ward.getWardMemberList()) {
				membersToDelete.add(wardMember.getMember());
			}
		}

		// 벌크 삭제 처리
		wardScheduleRepository.deleteByWardIdIn(wardIdsToDelete);
		wardRepository.deleteAllInBatch(wards);
		memberRepository.deleteAllInBatch(membersToDelete);
	}

	// 입장 대기 중인 상태 조회하기
	public boolean getEnterWaitingStatus(Member member) {
		Member enterWaitingMember = memberRepository.findById(member.getMemberId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원을 찾을 수 없습니다."));
		return enterWaitingRepository.existsByMember(enterWaitingMember);
	}

	// 현재 입장한 병동이 있는지 여부 조회하기
	public boolean getExistMyWard(Member member) {
		Member enterWaitingMember = memberRepository.findById(member.getMemberId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원을 찾을 수 없습니다."));
		return wardMemberRepository.existsByMember(enterWaitingMember);
	}

	// 입장 대기 신청 취소하기
	public void deleteEnteringWardWaiting(Member member) {
		Optional<EnterWaiting> waitingOpt = enterWaitingRepository.findByMember(member);

		if (waitingOpt.isPresent()) {
			// 대기 중이면 취소 가능
			enterWaitingRepository.delete(waitingOpt.get());
			return;
		}

		// 대기 중이 아니면, 현재 병동 입장 상태 확인
		boolean hasEnteredWard = wardMemberRepository.existsByMember(member);

		if (hasEnteredWard) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 병동에 입장한 상태입니다.");
		} else {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병동 입장이 거절된 상태입니다.");
		}
	}

	@Transactional
	public void updateRole(Member member, EditRoleRequestDto editRoleRequestDto) {
		member.setRole(editRoleRequestDto.getRole());
		memberRepository.save(member);
	}
}
