package net.dutymate.api.global.exception;

import lombok.Getter;

@Getter
public class EmailNotVerifiedException extends RuntimeException {
	private final Long memberId;

	public EmailNotVerifiedException(String message, Long memberId) {
		super(message);
		this.memberId = memberId;
	}
}
