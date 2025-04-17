// 주말 계산 함수
// 해당 월의 주말(토,일) 쌍을 반환합니다.
// 예: [[6,7], [13,14], [20,21], [27,28]]
// 첫 번째 숫자는 토요일, 두 번째 숫자는 일요일을 의미합니다.
export const getWeekendAndHolidayPairs = (
	year: number,
	month: number,
): number[][] => {
	const pairs: number[][] = [];
	const daysInMonth = new Date(year, month, 0).getDate();
	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(year, month - 1, day);
		const dayOfWeek = date.getDay();
		if (dayOfWeek === 6) {
			// 6은 토요일을 의미
			pairs.push([day, Math.min(day + 1, daysInMonth)]);
		}
	}
	return pairs;
};

// 해당 월의 기본 OFF 일수를 계산합니다.
// 주말(토,일)을 모두 더한 값을 반환합니다.
// 이 값은 근무표 상단에 "기본 OFF: X일" 형태로 표시됩니다.
export const getDefaultOffDays = (year: number, month: number): number => {
	const pairs = getWeekendAndHolidayPairs(year, month);
	return pairs.reduce((total, [start, end]) => {
		return total + (end - start + 1);
	}, 0);
};

// 근무표 생성이 가능한 최대 월을 계산합니다.
// 현재 달의 다음 달까지만 근무표 생성이 가능합니다.
// 예: 현재가 3월이면 4월까지만 근무표 생성 가능
export const getMaxAllowedMonth = () => {
	const today = new Date();
	const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);
	return {
		year: nextMonth.getFullYear(),
		month: nextMonth.getMonth() + 1,
	};
};

// 특정 날짜가 주말인지 확인합니다.
// 근무표에서 주말은 빨간색으로 표시됩니다.
export const isHoliday = (
	year: number,
	month: number,
	day: number,
): boolean => {
	const weekendPairs = getWeekendAndHolidayPairs(year, month);
	return weekendPairs.some((pair) => day >= pair[0] && day <= pair[1]);
};
