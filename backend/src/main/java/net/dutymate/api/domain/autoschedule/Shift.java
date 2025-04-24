package net.dutymate.api.global.enums;

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

	public String getValue() {
		return value;
	}
}
