package net.dutymate.api.rule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleUpdateRequestDto {

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

	private int maxShift;
	private int prioMaxShift;

}
