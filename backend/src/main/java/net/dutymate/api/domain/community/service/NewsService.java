package net.dutymate.api.domain.community.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.community.collections.News;
import net.dutymate.api.domain.community.dto.GptApiResponseDto;
import net.dutymate.api.domain.community.dto.NewsApiResponseDto;
import net.dutymate.api.domain.community.repository.NewsRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NewsService {

	private final NewsRepository newsRepository;

	@Value("${naver.client.id}")
	private String naverClientId;
	@Value("${naver.client.secret}")
	private String naverClientSecret;
	@Value("${naver.news.uri}")
	private String naverNewsUri;
	@Value("${openai.uri}")
	private String openaiUri;
	@Value("${openai.model}")
	private String openaiModel;
	@Value("${openai.secret-key}")
	private String openaiSecretKey;

	public List<GptApiResponseDto> getNews() throws JsonProcessingException {
		if (newsRepository.count() == 0) {
			refreshRecentNews();
		}
		List<GptApiResponseDto> newsList = newsRepository.findFirstByOrderByCreatedAtDesc().getNewsList();
		newsList.forEach(o -> {
			String description = o.getDescription();
			if (description != null && description.length() > 57) {
				o.setDescription(description.substring(0, 57) + "...");
			}
		});
		return newsList;
	}

	public void refreshRecentNews() throws JsonProcessingException {
		ObjectMapper mapper = new ObjectMapper();
		List<GptApiResponseDto> newsList = mapper.readValue(getChatGptResponse(generatePrompt()),
			new TypeReference<>() {
			});
		newsRepository.save(News.builder()
			.newsList(newsList)
			.createdAt(LocalDateTime.now())
			.build()
		);
	}

	private NewsApiResponseDto requestNewsApi() {
		try {
			// 첫 번째 시도
			return WebClient.create().get()
				.uri(naverNewsUri)
				.header("X-Naver-Client-Id", naverClientId)
				.header("X-Naver-Client-Secret", naverClientSecret)
				.retrieve()
				.bodyToMono(NewsApiResponseDto.class)
				.block();
		} catch (Exception e) {
			// 실패 시 1초 대기 후 한 번 더 시도
			try {
				Thread.sleep(1000); // 1000ms 지연
			} catch (InterruptedException ie) {
				Thread.currentThread().interrupt(); // 인터럽트 처리
				throw new RuntimeException("스레드가 인터럽트되었습니다.", ie);
			}

			try {
				return WebClient.create().get()
					.uri(naverNewsUri)
					.header("X-Naver-Client-Id", naverClientId)
					.header("X-Naver-Client-Secret", naverClientSecret)
					.retrieve()
					.bodyToMono(NewsApiResponseDto.class)
					.block();
			} catch (Exception second) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "뉴스 API 요청이 모두 실패했습니다.", second);
			}
		}
	}

	public String getChatGptResponse(String prompt) {
		return WebClient.create().post()
			.uri(openaiUri)
			.header("Authorization", "Bearer " + openaiSecretKey)
			.header("Content-Type", "application/json")
			.bodyValue(Map.of(
				"model", openaiModel,
				"messages", new Object[] {Map.of("role", "user", "content", prompt)},
				"temperature", 0.4
			))
			.retrieve()
			.bodyToMono(Map.class)
			.map(response -> {
				List<Map<String, Object>> choices = (List<Map<String, Object>>)response.get("choices");
				if (choices != null && !choices.isEmpty()) {
					Map<String, Object> message = (Map<String, Object>)choices.getFirst().get("message");
					return message.get("content").toString();  // 메시지 내용만 반환
				}
				return "No response from ChatGPT.";
			})
			.block();

	}

	public String generatePrompt() {
		return """
			당신에게 뉴스 기사 여러 건이 제공됩니다.
			이 뉴스들 중에서 간호사 및 의료 정책과 가장 관련 있는 기사 5건을 선별하세요.

			각 기사는 다음 조건에 맞게 요약해야 합니다:
			- 기사 제목: 최대 30자
			- 기사 요약 내용: 최대 60자
			- 뉴스 링크 포함
			- HTML 엔티티(&quot; 등)는 포함하지 말 것
			- 중복 기사 제거

			절대로 예시 형식("뉴스 제목 1" 등)으로 응답하지 말고, 실제 기사 내용을 기반으로만 응답하세요.

			아래 JSON 형식으로만 출력하세요:
			[
				{
					"title": "제목",
					"description": "요약 내용",
					"link": "링크"
				},
				...
			]
			다음은 뉴스 기사 목록입니다:
			""" + requestNewsApi().toString();
	}
}
