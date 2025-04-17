package net.dutymate.api.rule.dto;

import net.dutymate.api.entity.Rule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleResponseDto {
	private int wdayDCnt;
	private int wdayECnt;
	private int wdayNCnt;
	private int wendDCnt;
	private int wendECnt;
	private int wendNCnt;

	private int maxN;
	private int prioMaxN;

	private int minN;
	private int prioMinN;

	private int offCntAfterN;
	private int prioOffCntAfterN;

	private int maxShift;
	private int prioMaxShift;

	private int offCntAfterMaxShift;
	private int prioOffCntAfterMaxShift;

	public static RuleResponseDto of(Rule rule) {
		return RuleResponseDto.builder()
			.wdayDCnt(rule.getWdayDCnt())
			.wdayECnt(rule.getWdayECnt())
			.wdayNCnt(rule.getWdayNCnt())
			.wendDCnt(rule.getWendDCnt())
			.wendECnt(rule.getWendECnt())
			.wendNCnt(rule.getWendNCnt())
			.maxN(rule.getMaxN())
			.prioMaxN(rule.getPrioMaxN())
			.minN(rule.getMinN())
			.prioMinN(rule.getPrioMinN())
			.offCntAfterN(rule.getOffCntAfterN())
			.prioOffCntAfterN(rule.getPrioOffCntAfterN())
			.maxShift(rule.getMaxShift())
			.prioMaxShift(rule.getPrioMaxShift())
			.offCntAfterMaxShift(rule.getOffCntAfterMaxShift())
			.prioOffCntAfterMaxShift(rule.getPrioOffCntAfterMaxShift())
			.build();
	}
}
