package net.dutymate.api.domain.color.dto;

import net.dutymate.api.domain.color.Color;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ColorDto {

	private String dayBg;
	private String dayText;
	private String eveningBg;
	private String eveningText;
	private String nightBg;
	private String nightText;
	private String offBg;
	private String offText;
	private String midBg;
	private String midText;

	public static ColorDto of(Color color) {
		return ColorDto.builder()
			.dayBg(color.getDayBg())
			.dayText(color.getDayText())
			.eveningBg(color.getEveningBg())
			.eveningText(color.getEveningText())
			.nightBg(color.getNightBg())
			.nightText(color.getNightText())
			.offBg(color.getOffBg())
			.offText(color.getOffText())
			.midBg(color.getMidBg())
			.midText(color.getMidText())
			.build();
	}
}
