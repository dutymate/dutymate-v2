package net.dutymate.api.comunity.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dutymate.api.comunity.service.NewsService;

import com.fasterxml.jackson.core.JsonProcessingException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

	private final NewsService newsService;

	@GetMapping
	public ResponseEntity<?> getNews() throws JsonProcessingException {
		return ResponseEntity.ok(newsService.getNews());
	}
}
