package net.dutymate.api.domain.color;

import net.dutymate.api.domain.color.dto.ColorDto;
import net.dutymate.api.domain.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Color {

	@Id // 여기에 @Id 추가 필요
	private Long memberId;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId
	@JoinColumn(name = "member_id", nullable = false)
	private Member member;

	@Column(nullable = false)
	private String dayBg;

	@Column(nullable = false)
	private String dayText;

	@Column(nullable = false)
	private String eveningBg;

	@Column(nullable = false)
	private String eveningText;

	@Column(nullable = false)
	private String nightBg;

	@Column(nullable = false)
	private String nightText;

	@Column(nullable = false)
	private String offBg;

	@Column(nullable = false)
	private String offText;

	@Column(nullable = false)
	private String midBg;

	@Column(nullable = false)
	private String midText;

	// TODO 기본값 환경변수 처리
	public static Color of(Member member) {
		return Color.builder()
			.member(member)
			.dayBg("D0E5D2")
			.dayText("61A86A")
			.eveningBg("FCDADA")
			.eveningText("F68585")
			.nightBg("D5CCF5")
			.nightText("7454DF")
			.offBg("E5E5E1")
			.offText("999786")
			.midBg("68A6FC")
			.midText("FFFFFF")
			.build();
	}

	public void updateColor(ColorDto colorDto) {
		this.dayBg = colorDto.getDayBg();
		this.dayText = colorDto.getDayText();
		this.eveningBg = colorDto.getEveningBg();
		this.eveningText = colorDto.getEveningText();
		this.nightBg = colorDto.getNightBg();
		this.nightText = colorDto.getNightText();
		this.offBg = colorDto.getOffBg();
		this.offText = colorDto.getOffText();
		this.midBg = colorDto.getMidBg();
		this.midText = colorDto.getMidText();
	}
}
