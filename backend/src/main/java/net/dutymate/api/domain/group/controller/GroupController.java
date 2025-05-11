package net.dutymate.api.domain.group.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.group.dto.GroupCreateRequestDto;
import net.dutymate.api.domain.group.dto.GroupInviteResponseDto;
import net.dutymate.api.domain.group.dto.GroupMeetingRequestDto;
import net.dutymate.api.domain.group.dto.GroupMeetingResponseDto;
import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;
import net.dutymate.api.domain.group.service.GroupService;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.auth.annotation.Auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/group")
@RequiredArgsConstructor
public class GroupController {

	private final GroupService groupService;

	@PostMapping
	public ResponseEntity<?> createGroup(@Auth Member member,
		@RequestBody @Valid GroupCreateRequestDto groupCreateRequestDto) {
		groupService.createGroup(groupCreateRequestDto, member);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/image")
	public ResponseEntity<?> uploadGroupImage(@RequestParam("file") MultipartFile multipartFile) {
		return ResponseEntity.ok(groupService.uploadGroupImage(multipartFile));
	}

	@GetMapping("/{groupId}/random-image")
	public ResponseEntity<?> getGroupRandomImage(@Auth Member member, @PathVariable Long groupId) {
		return ResponseEntity.ok(groupService.updateGroupRandomImage(member, groupId));
	}

	@PutMapping("/{groupId}")
	public ResponseEntity<?> updateGroup(@Auth Member member,
		@RequestBody @Valid GroupUpdateRequestDto groupUpdateRequestDto,
		@PathVariable Long groupId) {
		groupService.updateGroup(member, groupUpdateRequestDto, groupId);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{groupId}")
	public ResponseEntity<?> deleteGroup(@Auth Member member, @PathVariable Long groupId) {
		groupService.leaveGroup(member, groupId);
		return ResponseEntity.ok().build();
	}

	@GetMapping
	public ResponseEntity<?> getAllGroups(@Auth Member member) {
		return ResponseEntity.ok(groupService.getAllGroups(member));
	}

	@GetMapping("/{groupId}")
	public ResponseEntity<?> getDetailGroup(@Auth Member member, @PathVariable Long groupId,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month, @RequestParam(defaultValue = "name") String orderBy) {
		return ResponseEntity.ok(groupService.getSingleGroup(member, groupId, new YearMonth(year, month), orderBy));
	}

	@GetMapping("/{groupId}/member")
	public ResponseEntity<?> getAllGroupMembers(@Auth Member member, @PathVariable Long groupId) {
		return ResponseEntity.ok(groupService.getAllGroupMembers(member, groupId));
	}

	@DeleteMapping("/{groupId}/member/{memberId}")
	public ResponseEntity<?> removeMemberFromGroup(@Auth Member member, @PathVariable("groupId") Long groupId,
		@PathVariable("memberId") Long memberId) {
		groupService.removeGroupMember(member, groupId, memberId);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/{groupId}/invite-link")
	public ResponseEntity<GroupInviteResponseDto> createInvitationGroupLink(@Auth Member member,
		@PathVariable Long groupId) {
		return ResponseEntity.ok(groupService.createInvitationGroupLink(member, groupId));
	}

	@PostMapping("/invite/{inviteToken}/join")
	public ResponseEntity<?> joinGroupInvite(@Auth Member member, @PathVariable String inviteToken) {
		groupService.acceptInviteToken(member, inviteToken);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/{groupId}/meeting-date")
	public ResponseEntity<GroupMeetingResponseDto> createGroupMeetingDate(@Auth Member member,
		@PathVariable Long groupId, @RequestBody
		GroupMeetingRequestDto groupMeetingRequestDto, @RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {

		return ResponseEntity.ok(
			groupService.createGroupMeetingDate(member, groupId, groupMeetingRequestDto, new YearMonth(year, month)));
	}
}
