package net.dutymate.api.domain.group.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import net.dutymate.api.domain.group.dto.GroupCreateRequestDto;
import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;
import net.dutymate.api.domain.group.service.GroupService;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.auth.annotation.Auth;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/group")
@RequiredArgsConstructor
public class GroupController {

	private final GroupService groupService;

	@PostMapping
	public ResponseEntity<?> createGroup(@Auth Member member,
		@RequestBody GroupCreateRequestDto groupCreateRequestDto) {
		groupService.createGroup(groupCreateRequestDto, member);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/image")
	public ResponseEntity<?> uploadGroupImage(@RequestParam("file") MultipartFile multipartFile) {
		groupService.uploadGroupImage(multipartFile);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/{groupId}")
	public ResponseEntity<?> updateGroup(@Auth Member member, @RequestBody GroupUpdateRequestDto groupUpdateRequestDto,
		@PathVariable Long groupId) {
		groupService.updateGroup(member, groupUpdateRequestDto, groupId);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{groupId}")
	public ResponseEntity<?> deleteGroup(@Auth Member member, @PathVariable Long groupId) {
		groupService.leaveGroup(member, groupId);
		return ResponseEntity.ok().build();
	}

}
