package net.dutymate.api.domain.group.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import net.dutymate.api.domain.group.dto.GroupCreateRequestDto;
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
		return groupService.createGroup(groupCreateRequestDto, member);
	}

	@PostMapping("/image")
	public ResponseEntity<?> uploadGroupImage(@RequestParam("file") MultipartFile multipartFile) {
		return ResponseEntity.ok(groupService.uploadGroupImage(multipartFile));
	}

}
