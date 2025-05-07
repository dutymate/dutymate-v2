package net.dutymate.api.domain.community.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.community.service.NewsService;

import com.fasterxml.jackson.core.JsonProcessingException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

	private final NewsService newsService;

	@Value("${api.news.secret}")
	private String apiNewsSecret;

	@GetMapping
	public ResponseEntity<?> getNews() throws JsonProcessingException {
		return ResponseEntity.ok(newsService.getNews());
	}

	@PostMapping
	public ResponseEntity<?> refreshRecentNews(
		@RequestHeader(value = "X-API-KEY", required = false) String apiKey) throws JsonProcessingException {
		if (apiKey == null || !apiKey.equals(apiNewsSecret)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid API Key");
		}
		newsService.refreshRecentNews();
		return ResponseEntity.ok().build();
	}
}
