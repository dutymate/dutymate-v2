package net.dutymate.api.domain.rule;

import net.dutymate.api.domain.rule.dto.RuleUpdateRequestDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Rule {

	private static final int WEEKDAY_DUTY_COUNT = 2;
	private static final int WEEKDAY_EVENING_COUNT = 2;
	private static final int WEEKDAY_NIGHT_COUNT = 2;
	private static final int WEEKEND_DUTY_COUNT = 2;
	private static final int WEEKEND_EVENING_COUNT = 2;
	private static final int WEEKEND_NIGHT_COUNT = 2;

	private static final int MAX_CONTINUOUS_SHIFT = 5;
	private static final int MAX_NIGHT_SHIFT = 3;
	private static final int MIN_NIGHT_SHIFT = 2;
	private static final int OFF_DAYS_AFTER_NIGHT = 2;
	private static final int OFF_DAYS_AFTER_MAX_SHIFT = 2;

	private static final int PRIORITY_MAX_NIGHT_SHIFT = 3;
	private static final int PRIORITY_MIN_NIGHT_SHIFT = 3;
	private static final int PRIORITY_OFF_DAYS_AFTER_NIGHT = 2;
	private static final int PRIORITY_MAX_CONTINUOUS_SHIFT = 3;
	private static final int PRIORITY_OFF_DAYS_AFTER_MAX_SHIFT = 2;

	private static final int PRIORITY_VERY_IMPORTANT = 3;
	private static final int PRIORITY_IMPORTANT = 2;
	private static final int PRIORITY_NORMAL = 1;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long ruleId;

	@Column(name = "wday_d_cnt")
	private Integer wdayDCnt;

	@Column(name = "wday_e_cnt")
	private Integer wdayECnt;

	@Column(name = "wday_n_cnt")
	private Integer wdayNCnt;

	@Column(name = "wend_d_cnt")
	private Integer wendDCnt;

	@Column(name = "wend_e_cnt")
	private Integer wendECnt;

	@Column(name = "wend_n_cnt")
	private Integer wendNCnt;

	@Column(name = "max_n")
	private Integer maxN;

	@Column(name = "prio_max_n")
	private Integer prioMaxN;

	@Column(name = "min_n")
	private Integer minN;

	@Column(name = "prio_min_n")
	private Integer prioMinN;

	@Column(name = "off_cnt_after_n")
	private Integer offCntAfterN;

	@Column(name = "prio_off_cnt_after_n")
	private Integer prioOffCntAfterN;

	@Column(name = "max_shift")
	private Integer maxShift;

	@Column(name = "prio_max_shift")
	private Integer prioMaxShift;

	@Column(name = "off_cnt_after_max_shift")
	private Integer offCntAfterMaxShift;

	@Column(name = "prio_off_cnt_after_max_shift")
	private Integer prioOffCntAfterMaxShift;

	// 기본값이 설정된 Builder
	@PrePersist
	protected void onCreate() {
		this.wdayDCnt = WEEKDAY_DUTY_COUNT;
		this.wdayECnt = WEEKDAY_EVENING_COUNT;
		this.wdayNCnt = WEEKDAY_NIGHT_COUNT;
		this.wendDCnt = WEEKEND_DUTY_COUNT;
		this.wendECnt = WEEKEND_EVENING_COUNT;
		this.wendNCnt = WEEKEND_NIGHT_COUNT;
		this.maxN = MAX_NIGHT_SHIFT;
		this.prioMaxN = PRIORITY_VERY_IMPORTANT;
		this.minN = MIN_NIGHT_SHIFT;
		this.prioMinN = PRIORITY_VERY_IMPORTANT;
		this.offCntAfterN = OFF_DAYS_AFTER_NIGHT;
		this.prioOffCntAfterN = PRIORITY_IMPORTANT;
		this.maxShift = MAX_CONTINUOUS_SHIFT;
		this.prioMaxShift = PRIORITY_VERY_IMPORTANT;
		this.offCntAfterMaxShift = OFF_DAYS_AFTER_MAX_SHIFT;
		this.prioOffCntAfterMaxShift = PRIORITY_IMPORTANT;
	}

	public void update(RuleUpdateRequestDto dto) {
		this.wdayDCnt = dto.getWdayDCnt();
		this.wdayECnt = dto.getWdayECnt();
		this.wdayNCnt = dto.getWdayNCnt();
		this.wendDCnt = dto.getWendDCnt();
		this.wendECnt = dto.getWendECnt();
		this.wendNCnt = dto.getWendNCnt();
		this.maxN = dto.getMaxN();
		this.prioMaxN = dto.getPrioMaxN();
		this.minN = dto.getMinN();
		this.prioMinN = dto.getPrioMinN();
		this.maxShift = dto.getMaxShift();
		this.prioMaxShift = dto.getPrioMaxShift();
	}

	public void minusNightCnt(int minus) {
		this.wdayNCnt -= minus;
		this.wendNCnt -= minus;
	}

	public void plusNightCnt(int plus) {
		this.wdayNCnt += plus;
		this.wendNCnt += plus;
	}

	public void minusWdayDcnt(int minus) {
		this.wdayDCnt -= minus;
	}

	public void plusWdayDcnt(int plus) {
		this.wdayDCnt += plus;
	}
}
