package net.dutymate.api.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = {"net.dutymate.api.domain.wardschedules.repository",
	"net.dutymate.api.domain.community.repository"})
public class MongoDBconfig {
}
