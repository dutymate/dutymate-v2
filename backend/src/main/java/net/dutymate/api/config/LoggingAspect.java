package net.dutymate.api.config;

import java.lang.reflect.Method;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

	private static final String LINE_SEPARATOR = "--------------------------------------------------";
	private static final String LOG_START = "[ START ] Method: {}";
	private static final String LOG_END = "[ END ] Method: {}";
	private static final String CLASS_NAME_FORMAT = "Class: {}";
	private static final String THREAD_NAME_FORMAT = "Thread: {}";
	private static final String HTTP_METHOD_FORMAT = "HTTP Method: {}";
	private static final String REQUEST_URI_FORMAT = "Request URI: {}";
	private static final String QUERY_STRING_FORMAT = "Query String: {}";
	private static final String EXECUTION_TIME_FORMAT = "Execution Time: {} ms";
	private static final String RETURN_TYPE_FORMAT = "Return Type: {}";
	private static final String RETURN_VALUE_FORMAT = "Return Value: {}";
	private static final int NANO_TO_MILLI = 1_000_000;

	@Pointcut("execution(* net.dutymate.api.*.controller.*.*(..))")
	private void cut() {

	}

	@Around("cut()")
	public Object aroundLog(final ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
		final Method method = getMethod(proceedingJoinPoint);
		final String methodName = method.getName();
		final String className = method.getDeclaringClass().getSimpleName();
		final String threadName = Thread.currentThread().getName();
		final HttpServletRequest request = getCurrentHttpRequest();

		log.info(LINE_SEPARATOR);
		log.info(LOG_START, methodName);
		log.info(CLASS_NAME_FORMAT, className);
		log.info(THREAD_NAME_FORMAT, threadName);

		if (request != null) {
			final String httpMethod = request.getMethod();
			final String requestUri = request.getRequestURI();
			String queryString = request.getQueryString();
			if (queryString != null) {
				queryString = URLDecoder.decode(queryString, StandardCharsets.UTF_8);
			}

			log.info(HTTP_METHOD_FORMAT, httpMethod);
			log.info(REQUEST_URI_FORMAT, requestUri);

			if (queryString != null) {
				log.info(QUERY_STRING_FORMAT, queryString);
			}
		}

		final long startTime = System.nanoTime();
		Object returnObj = proceedingJoinPoint.proceed();
		final long endTime = System.nanoTime();
		final long executionTime = (endTime - startTime) / NANO_TO_MILLI;

		log.info(LINE_SEPARATOR);
		log.info(LOG_END, methodName);
		log.info(EXECUTION_TIME_FORMAT, executionTime);

		if (returnObj != null) {
			log.info(RETURN_TYPE_FORMAT, returnObj.getClass().getSimpleName());
			log.info(RETURN_VALUE_FORMAT, returnObj);
		} else {
			log.info(RETURN_TYPE_FORMAT, "null");
			log.info(RETURN_VALUE_FORMAT, "null");
		}

		return returnObj;
	}

	private Method getMethod(final ProceedingJoinPoint proceedingJoinPoint) {
		final MethodSignature signature = (MethodSignature)proceedingJoinPoint.getSignature();
		return signature.getMethod();
	}

	private HttpServletRequest getCurrentHttpRequest() {
		final ServletRequestAttributes attr = (ServletRequestAttributes)RequestContextHolder.getRequestAttributes();
		if (attr != null) {
			return attr.getRequest();
		}
		return null;
	}
}
