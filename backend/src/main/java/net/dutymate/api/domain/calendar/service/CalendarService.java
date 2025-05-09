package net.dutymate.api.domain.calendar.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.calendar.dto.CalendarRequestDto;
import net.dutymate.api.domain.calendar.dto.CalendarResponseDto;
import net.dutymate.api.domain.calendar.entity.Calendar;
import net.dutymate.api.domain.calendar.repository.CalendarRepository;
import net.dutymate.api.domain.member.Member;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalendarService {

	private final CalendarRepository calendarRepository;

	//일별 캘린더 조회
	@Transactional
	public List<CalendarResponseDto> getCalendarsByDate(Member member, LocalDate date) {
		return calendarRepository.findAllByMemberAndDate(member, date).stream()
			.sorted(Comparator.comparing(Calendar::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())))
			.map(CalendarResponseDto::of)
			.toList();
	}

	// 캘린더 단건 조회
	@Transactional
	public CalendarResponseDto getCalendar(Member member, Long calendarId) {
		Calendar calendar = calendarRepository.findById(calendarId)
			.orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 ID의 캘린더가 존재하지 않습니다: " + calendarId));

		if (calendar.getMember() != member) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 작성한 캘린더가 아닙니다.");
		}

		return CalendarResponseDto.of(calendar);
	}

	//캘린더 생성
	@Transactional
	public void createCalendar(Member member, CalendarRequestDto calendarRequestDto) {
		Boolean isAllDay = calendarRequestDto.getIsAllDay();
		LocalDateTime startTime = calendarRequestDto.getStartTime();
		LocalDateTime endTime = calendarRequestDto.getEndTime();

		if (!isAllDay && (startTime == null || endTime == null)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시작 시간과 종료 시간을 설정해야 합니다.");
		}

		calendarRepository.save(calendarRequestDto.toCalendar(member));
	}

	//캘린더 수정
	@Transactional
	public void updateCalendar(Member member, Long calendarId, CalendarRequestDto calendarRequestDto) {
		Calendar calendar = calendarRepository.findById(calendarId)
			.orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 ID의 캘린더가 존재하지 않습니다: " + calendarId));

		if (calendar.getMember() != member) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 작성한 캘린더가 아닙니다.");
		}

		calendar.updateCalendar(calendarRequestDto);

		calendarRepository.save(calendar);
	}

	//캘린더 삭제
	@Transactional
	public void deleteCalendar(Member member, Long calendarId) {
		Calendar calendar = calendarRepository.findById(calendarId)
			.orElseThrow(
				() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 ID의 캘린더가 존재하지 않습니다: " + calendarId));

		if (member != calendar.getMember()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "캘린더를 삭제할 권한이 없습니다.");
		}

		calendarRepository.deleteById(calendarId);
	}
}
