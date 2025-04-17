package net.dutymate.api.wardschedules.collections;

import java.util.List;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.jackson.Jacksonized;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "ward_schedules")
@CompoundIndexes({
	@CompoundIndex(name = "ward_year_month_idx", def = "{'wardId' : 1, 'year' : 1, 'month' : 1}", unique = true)
})
public class WardSchedule {

	@Id
	private String id; // MongoDB에서 기본적으로 생성하는 ObjectId

	@Field("ward_id")
	private Long wardId;
	private int year;
	private int month;

	@Field("now_idx")
	private int nowIdx;

	// 듀티표 리스트
	@Setter
	private List<Duty> duties;

	public void setNowIdx(Integer nowIdx) {
		this.nowIdx = nowIdx;
	}

	public void setIdIfNotExist(String id) {
		if (this.id == null) {
			this.id = id;
		}
	}

	@Getter
	@NoArgsConstructor(access = AccessLevel.PROTECTED)
	@AllArgsConstructor(access = AccessLevel.PRIVATE)
	@Builder
	public static class Duty {
		private int idx;
		private List<NurseShift> duty;
		private History history;

		public void addNurseShift(NurseShift nurseShift) {
			this.duty.add(nurseShift);
		}
	}

	@Getter
	@NoArgsConstructor(access = AccessLevel.PROTECTED)
	@AllArgsConstructor(access = AccessLevel.PRIVATE)
	@Builder
	public static class NurseShift {
		@Field("member_id")
		private Long memberId;
		private String shifts;

		public void changeShifts(String shifts) {
			this.shifts = shifts;
		}
	}

	@Getter
	@NoArgsConstructor(access = AccessLevel.PROTECTED)
	@AllArgsConstructor(access = AccessLevel.PUBLIC)
	@Builder
	@Jacksonized // Lombok의 @Builder와 JSON 직렬화 간의 충돌을 방지
	public static class History {

		@Field("member_id")
		private Long memberId;

		private String name;
		private String before;
		private String after;

		@Field("modified_day")
		private Integer modifiedDay;
		@Field("is_auto_created")
		private Boolean isAutoCreated;
	}
}
