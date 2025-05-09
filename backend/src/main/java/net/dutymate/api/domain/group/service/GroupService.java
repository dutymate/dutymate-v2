package net.dutymate.api.domain.group.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.common.utils.FileNameUtils;
import net.dutymate.api.domain.group.GroupMember;
import net.dutymate.api.domain.group.NurseGroup;
import net.dutymate.api.domain.group.dto.GroupCreateRequestDto;
import net.dutymate.api.domain.group.dto.GroupImgResponseDto;
import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;
import net.dutymate.api.domain.group.repository.GroupRepository;
import net.dutymate.api.domain.member.Member;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupService {

	private final S3Client s3Client;
	private final GroupRepository groupRepository;

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
		boolean isGroupMember = group.getGroupMemberList().stream()
			.anyMatch(gm -> gm.getMember().getMemberId().equals(member.getMemberId()));

		if (!isGroupMember) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹 멤버가 아닙니다.");
		}

		// 3. 그룹 정보 수정하기
		group.update(groupUpdateRequestDto);
	}
}
