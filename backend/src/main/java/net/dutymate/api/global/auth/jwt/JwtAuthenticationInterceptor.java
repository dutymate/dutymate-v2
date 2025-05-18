package net.dutymate.api.global.auth.jwt;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationInterceptor implements HandlerInterceptor {

	private final JwtUtil jwtUtil;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		// OPTIONS 제외
		if (HttpMethod.OPTIONS.matches(request.getMethod())) {
			return true;
		}

		String uri = request.getRequestURI();
		String method = request.getMethod();

		// 회원가입 요청은 인증 제외
		if (uri.equals("/api/member") && HttpMethod.POST.matches(method)) {
			return true;
		}

		// 공지사항 조회(GET) 요청은 인증 제외
		if (uri.startsWith("/api/notice") && HttpMethod.GET.matches(method)) {
			return true;
		}

		// 토큰이 유효하면 Http Request에 memberId 삽입
		String token = jwtUtil.resolveToken(request.getHeader("Authorization"));
		if (token != null && jwtUtil.validateToken(token)) {
			request.setAttribute("memberId", jwtUtil.getMemberId(token));
			return true;
		}

		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
	}

}
