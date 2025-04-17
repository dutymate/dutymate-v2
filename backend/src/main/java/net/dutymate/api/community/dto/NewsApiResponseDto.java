package net.dutymate.api.comunity.dto;

import java.util.List;

import lombok.Data;

@Data
public class NewsApiResponseDto {
	private List<NewsItem> items;

	@Data
	public static class NewsItem {
		private String title;
		private String description;
		private String link;
	}
}
