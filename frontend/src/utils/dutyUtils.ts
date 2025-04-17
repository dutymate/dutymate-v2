export const convertDutyType = (
	duty: "D" | "E" | "N" | "O" | "X",
): "day" | "evening" | "night" | "off" => {
	const dutyMap = {
		D: "day",
		E: "evening",
		N: "night",
		O: "off",
		X: "off",
	} as const;
	return dutyMap[duty];
};
