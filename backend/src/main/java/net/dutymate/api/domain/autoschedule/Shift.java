package net.dutymate.api.domain.autoschedule;

import lombok.Getter;

@Getter
public enum Shift {
	D("D"),
	E("E"),
	N("N"),
	O("O"),
	M("M"),
	X("X");

	private final String value;

	Shift(String value) {
		this.value = value;
	}

}
