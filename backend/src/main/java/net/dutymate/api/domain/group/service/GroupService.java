package net.dutymate.api.domain.group.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
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
import net.dutymate.api.domain.group.dto.GroupListResponseDto;
import net.dutymate.api.domain.group.dto.GroupMemberListResponseDto;
import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;
import net.dutymate.api.domain.group.repository.GroupMemberRepository;
import net.dutymate.api.domain.group.repository.GroupRepository;
import net.dutymate.api.domain.member.Member;
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


	@Value("${cloud.aws.region.static}")
	private String region;

	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	@Transactional
	public void createGroup(GroupCreateRequestDto groupCreateRequestDto, Member member) {

		// 1. 새로운 그룹 객체 생성
		NurseGroup newGroup = groupCreateRequestDto.toGroup();

		// 2. 새 그룹원 추가하기
		// 그룹을 생성하는 사람은 그룹장 (isLeader = true)
		GroupMember groupLeader = GroupMember.builder()
			.group(newGroup)
			.member(member)
			.isLeader(true)
			.build();

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

		return groupMembers.stream()
			.map(GroupMember::getGroup)
			.distinct()
			.map(GroupListResponseDto::of)
			.toList();
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

	private Comparator<GroupDetailResponseDto.MemberDto> getComparator(String orderBy) {
		// 근무순 정렬
		if ("duty".equals(orderBy)) {
			List<String> order = List.of("D", "M", "E", "N", "O", "X");
			return Comparator.comparingInt(member -> order.indexOf(member.getDuty()));
		}

		// 이름순 정렬
		return Comparator.comparing(GroupDetailResponseDto.MemberDto::getName);
	}

	public GroupMemberListResponseDto getAllGroupMembers(Member member, Long groupId) {
		// 1. 그룹 여부 확인하기
		NurseGroup group = groupRepository.findById(groupId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹을 찾을 수 없습니다."));

		// 2. member가 해당 그룹의 멤버인지 확인
		group.validateMember(member);

		return GroupMemberListResponseDto.of(group);
	}
}
