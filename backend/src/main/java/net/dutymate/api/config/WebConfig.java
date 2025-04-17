package net.dutymate.api.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final AuthArgumentResolver authArgumentResolver;
	private final JwtAuthenticationInterceptor jwtAuthenticationInterceptor;

	private final String[] excludePath = {
		"/error",
		"/api/member/login", "/api/member/login/**", "/api/member/check-email",
	};

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedOriginPatterns("http://localhost:5173", "https://dutymate.net")
			.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
			.allowedHeaders("*")
			.allowCredentials(true)
			.maxAge(3600);
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(jwtAuthenticationInterceptor)
			.addPathPatterns("/**") // 인터셉터를 적용할 URL 패턴 (모든 경로 적용)
			.excludePathPatterns(excludePath); // 인터셉터 적용을 제외할 URL 패턴
	}

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(authArgumentResolver); // @Auth 어노테이션 등록
	}
}
