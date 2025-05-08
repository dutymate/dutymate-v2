package net.dutymate.api.domain.calendar.service;

import net.dutymate.api.domain.calendar.dto.CalendarRequest;
import net.dutymate.api.domain.calendar.dto.CalendarResponse;
import net.dutymate.api.domain.calendar.entity.Calendar;
import net.dutymate.api.domain.calendar.repository.CalendarRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CalendarService {

	private final CalendarRepository calendarRepository;

	//캘린더 생성
	public CalendarResponse createCalendar(CalendarRequest request) {
		System.out.println("Service - 캘린더 생성: " + request);
		Calendar calendar = Calendar.builder()
			.title(request.getTitle())
			.place(request.getPlace())
			.color(request.getColor())
			.isAllDay(request.getIsAllDay())
			.startTime(request.getStartTime())
			.endTime(request.getEndTime())
			.build();

		return CalendarResponse.fromEntity(calendarRepository.save(calendar));

	}

	//월별 캘린더 조회?
	public CalendarResponse getCalendar(Long id) {
		Calendar calendar = calendarRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("캘린더를 찾을 수 없습니다."));
		return CalendarResponse.fromEntity(calendar);
	}

	//일별 캘린더 조회?
	public List<CalendarResponse> getCalendarsByDate(LocalDate date) {
		LocalDateTime startOfDay = date.atStartOfDay();
		LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

		return calendarRepository.findAllByStartTimeBetween(startOfDay,endOfDay).stream()
			.map(CalendarResponse::fromEntity)
			.toList();
	}

	//캘린더 수정
	public CalendarResponse updateCalendar(Long id, CalendarRequest request) {
		Calendar calendar = calendarRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("캘린더를 찾을 수 없습니다."));

		calendar.setTitle(request.getTitle());
		calendar.setPlace(request.getPlace());
		calendar.setColor(request.getColor());
		calendar.setIsAllDay(request.getIsAllDay());
		calendar.setStartTime(request.getStartTime());
		calendar.setEndTime(request.getEndTime());

		return CalendarResponse.fromEntity(calendarRepository.save(calendar));
	}

	//캘린더 삭제
	public void deleteCalendar(Long id) {
		calendarRepository.deleteById(id);
	}
}
