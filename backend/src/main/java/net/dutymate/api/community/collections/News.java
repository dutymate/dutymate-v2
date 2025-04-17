package net.dutymate.api.comunity.collections;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.Document;

import net.dutymate.api.comunity.dto.GptApiResponseDto;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "news")
public class News {

	@Id
	private String id;

	private List<GptApiResponseDto> newsList;

	private LocalDateTime createdAt;
}
