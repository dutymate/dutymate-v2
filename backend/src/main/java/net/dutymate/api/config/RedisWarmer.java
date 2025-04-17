package net.dutymate.api.config;

import java.util.UUID;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RedisWarmer implements ApplicationListener<ApplicationReadyEvent> {

	private final RedisTemplate<String, String> redisTemplate;

	@Override
	public void onApplicationEvent(ApplicationReadyEvent event) {
		redisTemplate.opsForValue().set("key:warmup", UUID.randomUUID().toString());
	}
}
