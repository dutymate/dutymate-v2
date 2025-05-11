package net.dutymate.api.domain.group.service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.common.utils.FileNameUtils;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.group.GroupMember;
import net.dutymate.api.domain.group.NurseGroup;
import net.dutymate.api.domain.group.dto.GroupCreateRequestDto;
import net.dutymate.api.domain.group.dto.GroupDetailResponseDto;
import net.dutymate.api.domain.group.dto.GroupImgResponseDto;
import net.dutymate.api.domain.group.dto.GroupInviteResponseDto;
import net.dutymate.api.domain.group.dto.GroupListResponseDto;
import net.dutymate.api.domain.group.dto.GroupMeetingRequestDto;
import net.dutymate.api.domain.group.dto.GroupMeetingResponseDto;
import net.dutymate.api.domain.group.dto.GroupMemberListResponseDto;
import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;
import net.dutymate.api.domain.group.repository.GroupMemberRepository;
import net.dutymate.api.domain.group.repository.GroupRepository;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.domain.member.repository.MemberRepository;
import net.dutymate.api.domain.wardschedules.collections.MemberSchedule;
import net.dutymate.api.domain.wardschedules.repository.MemberScheduleRepository;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class GroupService {

	private final S3Client s3Client;
	private final GroupRepository groupRepository;
	private final GroupMemberRepository groupMemberRepository;
	private final MemberScheduleRepository memberScheduleRepository;
	private final RedisTemplate<String, String> redisTemplate;
	private final MemberRepository memberRepository;

	@Value("${cloud.aws.region.static}")
	private String region;

	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	@Value("${app.base-url}")
	private String baseUrl;

	@Transactional
	public void createGroup(GroupCreateRequestDto groupCreateRequestDto, Member member) {

		// 1. 새로운 그룹 객체 생성
		NurseGroup newGroup = groupCreateRequestDto.toGroup();

		// 2. 새 그룹원 추가하기
		// 그룹을 생성하는 사람은 그룹장 (isLeader = true)
		GroupMember groupLeader = GroupMember.builder().group(newGroup).member(member).isLeader(true).build();

		newGroup.addGroupMember(groupLeader);

		// 3. 그룹 추가하기
		groupRepository.save(newGroup);
	}

	@Transactional
	public GroupImgResponseDto uploadGroupImage(MultipartFile multipartFile) {
		String dirName = "group";

		if (multipartFile == null || multipartFile.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
		}

		String fileName = FileNameUtils.createFileName(multipartFile.getOriginalFilename(), dirName);

		try {
			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucket)
				.key(fileName)
				.contentType(multipartFile.getContentType())
				.build();

			s3Client.putObject(putObjectRequest,
				RequestBody.fromInputStream(multipartFile.getInputStream(), multipartFile.getSize()));

			String fileUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + fileName;

			return GroupImgResponseDto.of(fileUrl);

		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 업로드 중 오류가 발생했습니다.");
		}
	}

	@Transactional
	public void updateGroup(Member member, GroupUpdateRequestDto groupUpdateRequestDto, Long groupId) {

		// 1. 수정 대상 그룹 찾기
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "그룹을 찾을 수 없습니다."));

		// 2. member가 해당 그룹의 멤버인지 확인
		group.validateMember(member);

		// 3. 그룹 정보 수정하기
		group.update(groupUpdateRequestDto);
	}

	@Transactional
	public void leaveGroup(Member member, Long groupId) {

		// 1. 그룹 멤버인지 찾기
		GroupMember groupMember = groupMemberRepository.findByGroup_GroupIdAndMember(groupId, member)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹 멤버가 아닙니다."));

		NurseGroup group = groupMember.getGroup();

		// 2. 나가는 멤버가 그룹장인지 아닌지 확인
		if (groupMember.getIsLeader()) {
			// 2-1. 리더인 경우 -> 자신 외 다른 그룹 멤버 찾기
			List<GroupMember> otherGroupMemberList = group.getGroupMemberList()
				.stream()
				.filter(gm -> !gm.getGroupMemberId().equals(groupMember.getGroupMemberId()))
				.sorted(Comparator.comparing(GroupMember::getCreatedAt))
				.toList();

			// 2-2. 다른 그룹 멤버 여부에 따라
			if (otherGroupMemberList.isEmpty()) {
				// 그룹 멤버가 본인 혼자면, 그룹 자체를 삭제하기
				groupRepository.delete(group);
				return;
			} else {
				// 그룹 멤버가 있다면, 가장 오래된 멤버에게 그룹장 넘기기
				GroupMember nextLeader = otherGroupMemberList.getFirst();
				nextLeader.setIsLeader(true);
			}

		}
		// 3. 본인은 그룹에서 탈퇴
		group.getGroupMemberList().remove(groupMember);
		groupMemberRepository.delete(groupMember);
	}

	@Transactional(readOnly = true)
	public List<GroupListResponseDto> getAllGroups(Member member) {

		List<GroupMember> groupMembers = groupMemberRepository.findByMember(member);

		return groupMembers.stream().map(GroupMember::getGroup).distinct().map(GroupListResponseDto::of).toList();
	}

	@Transactional(readOnly = true)
	public GroupDetailResponseDto getSingleGroup(Member member, Long groupId, YearMonth yearMonth, String orderBy) {

		// 1. 그룹 여부 확인하기
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹을 찾을 수 없습니다."));

		// 2. member가 해당 그룹의 멤버인지 확인
		group.validateMember(member);

		// 3. 그룹에 속한 멤버 리스트 찾기
		List<GroupMember> groupMemberList = group.getGroupMemberList();

		// 4. memberId와 name 매핑하기
		// memberSchedule에서 가져온 memberId를 기반으로 name 조회하기 위함
		Map<Long, String> memberIdToName = groupMemberList.stream()
			.collect(Collectors.toMap(gm -> gm.getMember().getMemberId(), gm -> gm.getMember().getName()));

		List<Long> memberIdList = new ArrayList<>(memberIdToName.keySet());

		// 5. MongoDB에서 member shifts 조회
		List<MemberSchedule> scheduleList = memberScheduleRepository.findAllByMemberIdInAndYearAndMonth(memberIdList,
			yearMonth.year(), yearMonth.month());

		// 6. 조회된 스케줄을 Map으로 변환하기
		Map<Long, MemberSchedule> scheduleMap = scheduleList.stream()
			.collect(Collectors.toMap(MemberSchedule::getMemberId, memberSchedule -> memberSchedule));

		int daysInMonth = yearMonth.daysInMonth();
		// TreeMap을 쓰는 이유 : Date 기준으로 정렬하기 위함
		Map<LocalDate, List<GroupDetailResponseDto.MemberDto>> dateToMembersMap = new TreeMap<>();

		// 7. 그룹 멤버 기준으로 duty 채우기 (없으면, X로 반환)
		for (GroupMember gm : groupMemberList) {
			Long memberId = gm.getMember().getMemberId();
			String name = gm.getMember().getName();

			String shiftStr = scheduleMap.containsKey(memberId) && scheduleMap.get(memberId).getShifts() != null
				? scheduleMap.get(memberId).getShifts()
				: "X".repeat(daysInMonth);

			for (int day = 1; day <= daysInMonth; day++) {
				if (day - 1 >= shiftStr.length()) {
					continue;
				}

				String duty = String.valueOf(shiftStr.charAt(day - 1)); // 'D'
				LocalDate date = yearMonth.atDay(day); // '2025-05-09'

				GroupDetailResponseDto.MemberDto memberDto = GroupDetailResponseDto.MemberDto.builder()
					.memberId(memberId)
					.name(name)
					.duty(duty)
					.build();

				if (!dateToMembersMap.containsKey(date)) {
					dateToMembersMap.put(date, new ArrayList<>());
				}
				dateToMembersMap.get(date).add(memberDto);
			}
		}

		// 8. 정렬하기 (이름순 또는 근무순)
		Comparator<GroupDetailResponseDto.MemberDto> comparator = getComparator(orderBy);
		for (List<GroupDetailResponseDto.MemberDto> memberDtoList : dateToMembersMap.values()) {
			memberDtoList.sort(comparator);
		}

		// 9. DTO 변환하기
		List<GroupDetailResponseDto.ShiftDto> shiftDtoList = dateToMembersMap.entrySet()
			.stream()
			.map(entry -> GroupDetailResponseDto.ShiftDto.builder()
				.date(entry.getKey().toString())
				.memberList(entry.getValue())
				.build())
			.toList();

		return GroupDetailResponseDto.of(group, shiftDtoList);
	}

	// 그룹 듀티표 근무표 정렬 순서 반환하기
	private Comparator<GroupDetailResponseDto.MemberDto> getComparator(String orderBy) {
		// 근무순 정렬
		if ("duty".equals(orderBy)) {
			List<String> order = List.of("D", "M", "E", "N", "O", "X");
			return Comparator.comparingInt(member -> order.indexOf(member.getDuty()));
		}

		// 이름순 정렬
		return Comparator.comparing(GroupDetailResponseDto.MemberDto::getName);
	}

	@Transactional(readOnly = true)
	public GroupMemberListResponseDto getAllGroupMembers(Member member, Long groupId) {
		// 1. 그룹 여부 확인하기
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹을 찾을 수 없습니다."));

		// 2. member가 해당 그룹의 멤버인지 확인
		group.validateMember(member);

		return GroupMemberListResponseDto.of(group);
	}

	@Transactional
	public void removeGroupMember(Member member, Long groupId, Long targetMemberId) {
		// 1. member가 그룹장인지 확인
		GroupMember requesterGroupMember = groupMemberRepository.findByGroup_GroupIdAndMember(groupId, member)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹 멤버가 아닙니다."));

		if (!requesterGroupMember.getIsLeader()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹장만 멤버를 내보낼 수 있습니다.");
		}

		// 2. 내보낼 대상 멤버가 해당 그룹에 속해 있는지 확인
		GroupMember targetGroupMember = groupMemberRepository.findByGroup_GroupIdAndMember_MemberId(groupId,
			targetMemberId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹 멤버가 아닙니다."));

		// 3. 그룹장이 자기 자신을 내보내려는 경우 방지
		if (member.getMemberId().equals(targetMemberId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자기 자신은 내보낼 수 없습니다.");
		}

		// 4. 멤버 삭제
		requesterGroupMember.getGroup().getGroupMemberList().remove(targetGroupMember);
		groupMemberRepository.delete(targetGroupMember);
	}

	// 초대 링크 생성하기
	@Transactional
	public GroupInviteResponseDto createInvitationGroupLink(Member member, Long groupId) {

		// 1. 그룹 존재 여부 확인하기
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹이 존재하지 않습니다."));

		// 2. 그룹 멤버인지 확인
		group.validateMember(member);

		// 3. 그룹 초대 링크 Token으로 만들어 Redis에 24시간 동안 저장하기
		String token = UUID.randomUUID().toString();

		redisTemplate.opsForValue().set("invite:" + token, groupId.toString(), Duration.ofHours(24));

		String inviteLink = baseUrl + "/invite/" + token;
		return GroupInviteResponseDto.from(inviteLink, group);
	}

	// 초대 링크 클릭 시 -> 그룹 멤버로 초대하기
	@Transactional
	public void acceptInviteToken(Member member, String inviteToken) {

		// 1. 유효한 링크인지 확인
		String groupIdStr = redisTemplate.opsForValue().get("invite:" + inviteToken);

		if (groupIdStr == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "초대 링크가 유효하지 않습니다.");
		}

		// 2. 유효한 그룹인지 확인
		Long groupId = Long.parseLong(groupIdStr);
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹이 존재하지 않습니다."));

		// 3. 그룹 가입 여부 확인
		if (group.isMember(member.getMemberId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 그룹에 가입되어 있습니다.");
		}

		// 4. 그룹 멤버로 추가하기
		GroupMember groupMember = GroupMember.builder().group(group).member(member).isLeader(false).build();

		group.addGroupMember(groupMember);
		groupMemberRepository.save(groupMember);
	}

	@Transactional
	public GroupMeetingResponseDto createGroupMeetingDate(Member member, Long groupId,
		GroupMeetingRequestDto groupMeetingRequestDto, YearMonth yearMonth) {

		// 1. 존재하는 그룹인지 확인
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹을 찾을 수 없습니다."));
		group.validateMember(member);

		// 2. 요청된 멤버들이 모두 유효한 사용자이고, 해당 그룹의 멤버인지 확인
		List<Long> groupMemberIds = groupMeetingRequestDto.getGroupMemberIds();
		Map<Long, String> memberIdToName = memberRepository.findAllById(groupMemberIds)
			.stream()
			.collect(Collectors.toMap(Member::getMemberId, Member::getName));

		if (memberIdToName.size() != groupMemberIds.size()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 회원이 포함되어 있습니다.");
		}

		for (Long id : groupMemberIds) {
			if (!group.isMember(id)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹에 속하지 않은 멤버가 포함되어 있습니다.");
			}
		}

		// memberId -> shift 배열 (31일)
		Map<Long, String[]> memberShiftMap = new HashMap<>();
		for (MemberSchedule schedule : memberScheduleRepository.findAllByMemberIdInAndYearAndMonth(
			groupMeetingRequestDto.getGroupMemberIds(), yearMonth.year(), yearMonth.month())) {
			String[] shifts = schedule.getShifts().split("");
			memberShiftMap.put(schedule.getMemberId(), shifts);
		}

		int daysInMonth = yearMonth.daysInMonth();

		List<GroupMeetingResponseDto.RecommendedDate> result = IntStream.range(0, daysInMonth).mapToObj(dayIndex -> {
			int score = calculateDailyScore(memberShiftMap, dayIndex);
			LocalDate date = yearMonth.atDay(dayIndex + 1);

			List<GroupMeetingResponseDto.MemberDutyDto> dutyList = groupMeetingRequestDto.getGroupMemberIds()
				.stream()
				.map(id -> GroupMeetingResponseDto.MemberDutyDto.builder()
					.memberId(id)
					.name(memberIdToName.get(id))
					.duty(getDutySafe(memberShiftMap.get(id), dayIndex))
					.build())
				.toList();

			return GroupMeetingResponseDto.RecommendedDate.builder()
				.date(date)
				.score(score)
				.memberList(dutyList)
				.build();
		}).sorted((a, b) -> Integer.compare(b.getScore(), a.getScore())).limit(5).toList();

		return GroupMeetingResponseDto.builder().recommendedDateList(result).build();

	}

	private int calculateDailyScore(Map<Long, String[]> memberShiftMap, int dayIndex) {
		int totalScore = 0;
		List<String> duties = new ArrayList<>();

		// 모든 멤버의 해당 일자 duty 수집 및 점수 합산
		for (Map.Entry<Long, String[]> entry : memberShiftMap.entrySet()) {
			String[] shifts = entry.getValue();
			String duty = getDutySafe(shifts, dayIndex);
			duties.add(duty);
			totalScore += switch (duty) {
				case "O" -> 10;
				case "D", "M" -> 7;
				case "E" -> 5;
				case "N" -> getNightScore(shifts, dayIndex);
				default -> 0;
			};
		}

		// D와 E 또는 M과 E가 함께 있으면 약속 부적합 → 점수 0 처리
		if ((duties.contains("D") && duties.contains("E")) || (duties.contains("M") && duties.contains("E"))) {
			return 0;
		}

		return totalScore;
	}

	private int getNightScore(String[] shifts, int dayIndex) {
		if (dayIndex == 0 || !"N".equals(shifts[dayIndex - 1])) {
			return 3; // 첫 N 근무
		}
		return 1; // 연속된 N
	}

	private String getDutySafe(String[] shifts, int dayIndex) {
		return (shifts != null && dayIndex < shifts.length) ? shifts[dayIndex] : "X";
	}

}
