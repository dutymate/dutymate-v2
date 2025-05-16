package net.dutymate.api.domain.group;

import java.util.List;

import lombok.Getter;

@Getter
public enum MeetingMessageType {

	ALL_OFF(TimeSlotStatus.BEST, TimeSlotStatus.BEST),
	OFF_AND_DAY_OR_MID(TimeSlotStatus.HARD, TimeSlotStatus.BEST),
	OFF_AND_EVENING(TimeSlotStatus.OKAY, TimeSlotStatus.HARD),
	OFF_AND_NIGHT(TimeSlotStatus.OKAY, TimeSlotStatus.OKAY),
	OFF_DAY_AND_NIGHT(TimeSlotStatus.HARD, TimeSlotStatus.OKAY),
	DAY_AND_EVENING(TimeSlotStatus.HARD, TimeSlotStatus.HARD),
	NIGHT_AND_EVENING(TimeSlotStatus.OKAY, TimeSlotStatus.HARD),
	MIXED_OR_COMPLEX(TimeSlotStatus.HARD, TimeSlotStatus.HARD);

	private final TimeSlotStatus lunch;
	private final TimeSlotStatus dinner;

	MeetingMessageType(TimeSlotStatus lunch, TimeSlotStatus dinner) {
		this.lunch = lunch;
		this.dinner = dinner;
	}

	public static MeetingMessageType resolve(List<String> duties) {
		boolean hasO = duties.contains("O");
		boolean hasD = duties.contains("D");
		boolean hasM = duties.contains("M");
		boolean hasE = duties.contains("E");
		boolean hasN = duties.contains("N");

		boolean hasDayOrMid = hasD || hasM;

		if (hasO && !hasD && !hasM && !hasE && !hasN) {
			return MeetingMessageType.ALL_OFF;
		}

		if (hasO && hasDayOrMid && !hasE && !hasN) {
			return MeetingMessageType.OFF_AND_DAY_OR_MID;
		}

		if (hasO && hasE && !hasDayOrMid && !hasN) {
			return MeetingMessageType.OFF_AND_EVENING;
		}

		if (hasO && hasN && !hasDayOrMid && !hasE) {
			return MeetingMessageType.OFF_AND_NIGHT;
		}

		if (hasO && hasDayOrMid && hasN && !hasE) {
			return MeetingMessageType.OFF_DAY_AND_NIGHT;
		}

		if (hasDayOrMid && hasE) {
			return MeetingMessageType.DAY_AND_EVENING;
		}

		if (hasN && hasE && !hasO) {
			return MeetingMessageType.NIGHT_AND_EVENING;
		}

		return MeetingMessageType.MIXED_OR_COMPLEX;
	}
}
