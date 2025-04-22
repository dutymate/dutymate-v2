package net.dutymate.api.domain.member.dto;

public record VerifyCodeRequestDto(String email, String code) {
}
