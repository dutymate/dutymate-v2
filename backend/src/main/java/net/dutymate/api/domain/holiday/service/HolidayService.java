package net.dutymate.api.domain.holiday.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import net.dutymate.api.domain.holiday.Holiday;
import net.dutymate.api.domain.holiday.dto.HolidayResponseDto;
import net.dutymate.api.domain.holiday.repository.HolidayRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class HolidayService {

	private final HolidayRepository holidayRepository;

	@Value("${API_GO_DATA_KR_KEY}")
	private String apiKey;

	public HolidayResponseDto getHolidayByYearAndMonth(Integer year, Integer month) {
		// year나 month가 null인 경우 현재 날짜로 설정
		if (year == null || month == null) {
			LocalDateTime now = LocalDateTime.now();
			year = year != null ? year : now.getYear();
			month = month != null ? month : now.getMonthValue();
		}

		// date 필드를 사용한 조회 메서드 사용
		List<Holiday> holidays = holidayRepository.findHolidaysInMonth(year, month);
		return HolidayResponseDto.from(year, month, holidays);
	}

	public void updateYearHolidays(int year) {
		for (int month = 1; month <= 12; month++) {
			try {
				updateMonthHolidays(year, month);
				// API 호출 간격 조절 (필요시)
				Thread.sleep(500);
			} catch (Exception e) {
				log.error("{}년 {}월 공휴일 정보 업데이트 실패: {}", year, month, e.getMessage());
			}
		}
	}

	private void updateMonthHolidays(int year, int month) throws Exception {
		// API 호출에 필요한 날짜 형식
		String solYear = String.valueOf(year);
		String solMonth = String.format("%02d", month);

		// API 호출 URL 생성
		String urlBuilder = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo" + "?"
			+ URLEncoder.encode("serviceKey", StandardCharsets.UTF_8)
			+ "="
			+ apiKey
			+ "&"
			+ URLEncoder.encode("solYear", StandardCharsets.UTF_8)
			+ "="
			+ URLEncoder.encode(solYear, StandardCharsets.UTF_8)
			+ "&"
			+ URLEncoder.encode("solMonth", StandardCharsets.UTF_8)
			+ "="
			+ URLEncoder.encode(solMonth, StandardCharsets.UTF_8)
			+ "&"
			+ URLEncoder.encode("_type", StandardCharsets.UTF_8)
			+ "="
			+ URLEncoder.encode("json", StandardCharsets.UTF_8)
			+ "&_type=json";
		// API 호출
		URL url = new URL(urlBuilder);
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("GET");

		// 응답 읽기
		BufferedReader rd;
		if (conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
			rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
		} else {
			throw new RuntimeException("API 호출 실패: " + conn.getResponseCode());
		}

		StringBuilder sb = new StringBuilder();
		String line;
		while ((line = rd.readLine()) != null) {
			sb.append(line);
		}
		rd.close();
		conn.disconnect();

		// Jackson을 사용한 JSON 파싱
		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode rootNode = objectMapper.readTree(sb.toString());
		JsonNode items = rootNode.path("response").path("body").path("items");

		List<Holiday> holidays = new ArrayList<>();

		// 결과가 있는 경우
		if (!items.isMissingNode() && !items.isNull()) {
			JsonNode itemNode = items.path("item");

			// 배열인 경우 (여러 공휴일)
			if (itemNode.isArray()) {
				for (JsonNode node : itemNode) {
					processHolidayItem(node, holidays);
				}
			} else if (!itemNode.isMissingNode() && !itemNode.isNull()) {
				processHolidayItem(itemNode, holidays);
			}
		}

		// DB에 저장
		for (Holiday holiday : holidays) {
			// 이미 존재하는 공휴일인지 확인 후 저장 (중복 방지)
			if (!holidayRepository.existsByDate(holiday.getDate())) {
				holidayRepository.save(holiday);
				log.info("공휴일 추가: {} - {}", holiday.getDate(), holiday.getName());
			} else {
				log.debug("공휴일 이미 존재함: {} - {}", holiday.getDate(), holiday.getName());
			}
		}
	}

	private void processHolidayItem(JsonNode holidayNode, List<Holiday> holidays) {
		String dateName = holidayNode.path("dateName").asText();
		String locdate = String.valueOf(holidayNode.path("locdate").asInt());

		// 날짜 파싱 (yyyyMMdd 형식)
		int year = Integer.parseInt(locdate.substring(0, 4));
		int month = Integer.parseInt(locdate.substring(4, 6));
		int day = Integer.parseInt(locdate.substring(6, 8));

		LocalDate date = LocalDate.of(year, month, day);

		// Holiday 엔티티 생성
		Holiday holiday = Holiday.builder()
			.date(date)
			.name(dateName)
			.isLunar(false) // API에서는 양력으로 제공됨
			.year(year)
			.month(month)
			.day(day)
			.build();

		holidays.add(holiday);
	}
}
