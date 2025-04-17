package net.dutymate.api.enumclass;

public enum Shift {
	D("D"),
	E("E"),
	N("N"),
	O("O"),
	X("X");

	private final String value;

	Shift(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
