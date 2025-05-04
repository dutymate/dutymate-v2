package net.dutymate.api.global.config;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import net.dutymate.api.domain.common.utils.YearMonth;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class YearMonthConfig {

	private final ApplicationContext applicationContext;

	@Bean
	public String initYearMonth() {
		YearMonth.setApplicationContext(applicationContext);
		return "yearMonthInitialized";
	}
}