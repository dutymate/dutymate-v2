package net.dutymate.api.domain.color.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import net.dutymate.api.domain.color.Color;
import net.dutymate.api.domain.color.dto.ColorDto;
import net.dutymate.api.domain.color.repository.ColorRepository;
import net.dutymate.api.domain.member.Member;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ColorService {

	private final ColorRepository colorRepository;

	@Transactional
	public void updateColor(Member member, ColorDto colorDto) {
		Color color = member.getColor();
		color.updateColor(colorDto);
		colorRepository.save(color);
	}
}
