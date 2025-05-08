package net.dutymate.api.domain.wardschedules.collections;

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

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@Document(collection = "member_schedules")
@CompoundIndexes({
	@CompoundIndex(name = "member_year_month_idx", def = "{'memberId' : 1, 'year' : 1, 'month' : 1}", unique = true)
})
public class MemberSchedule {

	@Id
	private String id; // MongoDB에서 기본적으로 생성하는 ObjectId

	@Setter
	@Field("member_id")
	private Long memberId;
	private int year;
	private int month;

	@Setter
	private String shifts;
}
