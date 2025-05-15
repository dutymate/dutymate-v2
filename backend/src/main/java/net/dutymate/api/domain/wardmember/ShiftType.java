package net.dutymate.api.domain.wardmember;

import lombok.Getter;

@Getter
public enum ShiftType {
	D(4),
	E(2),
	N(1),
	M(8),
	ALL(7);

	private final Integer flag;

	ShiftType(final Integer flag) {
		this.flag = flag;
	}

}

