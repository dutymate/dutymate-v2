package net.dutymate.api.domain.group;

import lombok.Getter;

@Getter
public enum TimeSlotStatus {
	BEST("추천해요"),
	OKAY("가능해요"),
	HARD("어려워요");

	private final String label;

	TimeSlotStatus(String label) {
		this.label = label;
	}
}
