package net.dutymate.api.domain.community.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.community.collections.News;

@Repository
public interface NewsRepository extends MongoRepository<News, String> {
	News findFirstByOrderByCreatedAtDesc();
}
