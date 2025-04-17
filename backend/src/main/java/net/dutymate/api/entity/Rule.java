package net.dutymate.api.entity;

import net.dutymate.api.rule.dto.RuleUpdateRequestDto;

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
		this.wdayDCnt = 3;
		this.wdayECnt = 2;
		this.wdayNCnt = 2;
		this.wendDCnt = 2;
		this.wendECnt = 2;
		this.wendNCnt = 2;
		this.maxN = 3;
		this.prioMaxN = 3;
		this.minN = 2;
		this.prioMinN = 3;
		this.offCntAfterN = 2;
		this.prioOffCntAfterN = 2;
		this.maxShift = 5;
		this.prioMaxShift = 3;
		this.offCntAfterMaxShift = 2;
		this.prioOffCntAfterMaxShift = 2;
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
