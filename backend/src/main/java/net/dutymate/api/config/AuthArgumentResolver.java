package net.dutymate.api.config;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.annotation.Auth;
import net.dutymate.api.entity.Member;
import net.dutymate.api.member.repository.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthArgumentResolver implements HandlerMethodArgumentResolver {

	private final MemberRepository memberRepository;

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		boolean hasAuthAnnotation = parameter.hasParameterAnnotation(Auth.class); // @Auth 어노테이션을 갖고있는지
		boolean hasMemberType = Member.class.isAssignableFrom(parameter.getParameterType()); // Member 타입인지

		return hasAuthAnnotation && hasMemberType;
	}

	@Override
	public Member resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
		NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
		Auth annotation = parameter.getParameterAnnotation(Auth.class);

		// @Auth(required=false)인 경우 null 반환
		if (annotation != null && !annotation.required()) {
			return null;
		}

		// Http Request 객체 추출
		HttpServletRequest request = (HttpServletRequest)webRequest.getNativeRequest();

		// Http request 객체에서 memberId 추출
		Long memberId = (Long)request.getAttribute("memberId");

		// Member 엔티티 반환
		return memberRepository.findById(memberId).orElseThrow(
			() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."));
	}
}
