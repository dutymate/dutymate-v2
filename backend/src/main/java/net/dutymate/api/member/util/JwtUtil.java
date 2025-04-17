package net.dutymate.api.member.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtUtil {

	private final RedisTemplate<String, String> redisTemplate;

	@Value("${jwt.secret}")
	private String secretKey;
	@Value("${jwt.expiration}")
	private long expiration;

	private static final int TOKEN_BEGIN_INDEX = 7;
	private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

	// SecretKey 생성
	private SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
	}

	// Access Token 생성
	public String createToken(Long memberId) {
		return Jwts.builder()
			.issuedAt(new Date())
			.expiration(new Date(System.currentTimeMillis() + expiration))
			.claim("memberId", memberId)
			.signWith(getSigningKey())
			.compact();
	}

	// Token 유효성 검증
	public boolean validateToken(String token) {
		try {
			// 토큰이 블랙리스트에 있는지 먼저 확인
			if (isBlacklisted(token)) {
				return false;
			}

			Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	// Token에서 멤버 정보 추출
	public Long getMemberId(String token) {
		return Jwts.parser()
			.verifyWith(getSigningKey())
			.build()
			.parseSignedClaims(token)
			.getPayload()
			.get("memberId", Long.class);
	}

	public String resolveToken(String bearerToken) {
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(TOKEN_BEGIN_INDEX);
		}
		return null;
	}

	// 토큰을 블랙리스트에 추가
	public void addToBlacklist(String token, long remainingTimeInMillis) {
		String key = BLACKLIST_PREFIX + token;
		redisTemplate.opsForValue().set(key, "blocked", remainingTimeInMillis, TimeUnit.MILLISECONDS);
	}

	// 토큰이 블랙리스트에 있는지 확인
	public boolean isBlacklisted(String token) {
		String key = BLACKLIST_PREFIX + token;
		return Boolean.TRUE.equals(redisTemplate.hasKey(key));
	}

	// 토큰에서 만료 시간 추출
	public long getRemainingTime(String token) {
		Claims claims = Jwts.parser()
			.verifyWith(getSigningKey())
			.build()
			.parseSignedClaims(token)
			.getPayload();

		long expirationTime = claims.getExpiration().getTime();
		long currentTime = System.currentTimeMillis();
		return expirationTime - currentTime;
	}
}
