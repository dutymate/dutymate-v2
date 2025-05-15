package net.dutymate.api.domain.group;

import java.util.List;

import lombok.Getter;

@Getter
public enum MeetingMessageType {

	ALL_OFF("모두 OFF 입니다! 하루 종일 약속이 가능해요!"),
	OFF_AND_DAY_OR_MID("낮 근무자가 있어요. 저녁 약속이 좋아요!"),
	OFF_AND_EVENING("저녁 근무자가 있어요. 점심 약속이 좋아요!"),
	OFF_AND_NIGHT("저녁 약속은 가능하지만 점심은 피해주세요!"),
	OFF_DAY_AND_NIGHT("저녁 약속이 가장 무난해요!"),
	DAY_AND_EVENING("낮과 저녁 근무자가 겹쳐 약속이 어려워요!"),
	NIGHT_AND_EVENING("점심 약속이 가장 무난해요!"),
	MIXED_OR_COMPLEX("근무가 다양하게 섞여 있어 약속 잡기 어려울 수 있어요!"),
	UNKNOWN("일부 근무 정보가 없어요. 정확한 추천이 어려워요!");

	private final String message;

	MeetingMessageType(String message) {
		this.message = message;
	}

	public static MeetingMessageType resolve(List<String> duties) {
		boolean hasO = duties.contains("O");
		boolean hasD = duties.contains("D");
		boolean hasM = duties.contains("M");
		boolean hasE = duties.contains("E");
		boolean hasN = duties.contains("N");
		boolean hasX = duties.contains("X");

		boolean hasDayOrMid = hasD || hasM;

		if (hasX) {
			return MeetingMessageType.UNKNOWN;
		}

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
