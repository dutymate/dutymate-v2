export const convertDutyType = (
	duty: "D" | "E" | "N" | "O" | "X" | "M",
): "day" | "evening" | "night" | "off" | "mid" => {
	const dutyMap = {
		D: "day",
		E: "evening",
		N: "night",
		O: "off",
		X: "off",
		M: "mid",
	} as const;
	return dutyMap[duty];
};
