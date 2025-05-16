package net.dutymate.api.domain.member.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import net.dutymate.api.domain.member.Member;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginLog {

	private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

	private String memberId;
	private String loginAt;
	private String createdAt;
	private boolean success;
	private String failReason;

	public static LoginLog of(Member member, boolean success, String failReason) {
		return LoginLog.builder()
			.memberId(member == null ? null : String.valueOf(member.getMemberId()))
			.loginAt(LocalDateTime.now().format(formatter))
			.createdAt(member == null ? null : member.getCreatedAt().toLocalDateTime().format(formatter))
			.success(success)
			.failReason(failReason)
			.build();
	}
}
