package net.dutymate.api.domain.color.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.domain.color.dto.ColorDto;
import net.dutymate.api.domain.color.service.ColorService;
import net.dutymate.api.domain.member.Member;
import net.dutymate.api.global.auth.annotation.Auth;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/duty/color")
@RequiredArgsConstructor
public class ColorController {

	private final ColorService colorService;

	@PutMapping
	public ResponseEntity<Void> updateColor(@Auth Member member,
		@RequestBody ColorDto colorDto) {
		colorService.updateColor(member, colorDto);
		return ResponseEntity.ok().build();
	}
}
