package net.dutymate.api.global.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	private static final String LINE_SEPARATOR = "--------------------------------------------------";
	private static final String ERROR_LOG_START = "[ ERROR ] Method: {}";
	private static final String CLASS_FORMAT = "Class: {}";
	private static final String STATUS_FORMAT = "Status: {}";
	private static final String MESSAGE_FORMAT = "Message: {}";

	private static final String TIMESTAMP_KEY = "timestamp";
	private static final String STATUS_KEY = "status";
	private static final String MESSAGE_KEY = "message";

	private static final String UNKNOWN = "Unknown";
	private static final String BASE_PACKAGE = "net.dutymate";

	@ExceptionHandler(ResponseStatusException.class)
	protected ResponseEntity<?> handleResponseStatusException(ResponseStatusException ex) {
		final StackTraceElement source = getFirstRelevantStackTrace(ex);
		final String methodName = source.getMethodName();
		final String className = getSimpleClassName(source.getClassName());
		final String status = HttpStatus.valueOf(ex.getStatusCode().value()).name();
		final String message = ex.getReason();

		log.error(LINE_SEPARATOR);
		log.error(ERROR_LOG_START, methodName);
		log.error(CLASS_FORMAT, className);
		log.error(STATUS_FORMAT, status);
		log.error(MESSAGE_FORMAT, message);

		Map<String, Object> body = new HashMap<>();
		body.put(TIMESTAMP_KEY, LocalDateTime.now());
		body.put(STATUS_KEY, HttpStatus.valueOf(ex.getStatusCode().value()).name());
		body.put(MESSAGE_KEY, ex.getReason());

		return new ResponseEntity<>(body, ex.getStatusCode());
	}

	// Spring Validation 예외 처리
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<?> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
		Map<String, Object> body = new HashMap<>();

		body.put(TIMESTAMP_KEY, LocalDateTime.now());
		body.put(STATUS_KEY, HttpStatus.BAD_REQUEST.getReasonPhrase());

		List<String> errors = exception.getBindingResult().getFieldErrors()
			.stream()
			.map(DefaultMessageSourceResolvable::getDefaultMessage)
			.toList();
		body.put(MESSAGE_KEY, errors.getFirst());

		return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
	}

	private StackTraceElement getFirstRelevantStackTrace(Throwable ex) {
		StackTraceElement[] stackTrace = ex.getStackTrace();

		for (StackTraceElement element : stackTrace) {
			if (element.getClassName().startsWith(BASE_PACKAGE)) {
				return element;
			}
		}

		if (stackTrace.length > 0) {
			return stackTrace[0];
		}
		return new StackTraceElement(UNKNOWN, UNKNOWN, null, -1);
	}

	private String getSimpleClassName(String fullClassName) {
		try {
			return Class.forName(fullClassName).getSimpleName();
		} catch (ClassNotFoundException e) {
			return fullClassName.substring(fullClassName.lastIndexOf('.') + 1); // 패키지명 제외
		}
	}

	// 이메일 인증 예외처리
	@ExceptionHandler(EmailNotVerifiedException.class)
	protected ResponseEntity<?> handleEmailNotVerifiedException(EmailNotVerifiedException ex) {
		final StackTraceElement source = getFirstRelevantStackTrace(ex);
		final String methodName = source.getMethodName();
		final String className = getSimpleClassName(source.getClassName());
		final String status = HttpStatus.BAD_REQUEST.name();
		final String message = ex.getMessage();

		log.error(LINE_SEPARATOR);
		log.error(ERROR_LOG_START, methodName);
		log.error(CLASS_FORMAT, className);
		log.error(STATUS_FORMAT, status);
		log.error(MESSAGE_FORMAT, message);

		Map<String, Object> body = new HashMap<>();
		body.put(TIMESTAMP_KEY, LocalDateTime.now());
		body.put(STATUS_KEY, status);
		body.put(MESSAGE_KEY, message);
		body.put("memberId", ex.getMemberId());

		return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
	}
}
