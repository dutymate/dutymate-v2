/**
 * 한글 관련 유틸리티 함수
 */

/**
 * 완성형 한글 문자인지 체크하는 함수
 * 한글 유니코드 범위: 가(0xAC00) ~ 힣(0xD7A3)를 사용하여 판별
 * @param str 검사할 문자
 * @returns 완성형 한글 문자인 경우 true
 */
export const isCompleteKoreanChar = (str: string): boolean => {
	const koreanCompleteCharRegex = /[가-힣]/;
	return koreanCompleteCharRegex.test(str);
};

/**
 * 문자열에 완성형 한글이 포함되어 있는지 확인
 * @param str 검사할 문자열
 * @returns 완성형 한글이 하나라도 포함된 경우 true
 */
export const hasCompleteKoreanChars = (str: string): boolean => {
	for (let i = 0; i < str.length; i++) {
		if (isCompleteKoreanChar(str[i])) {
			return true;
		}
	}
	return false;
};

/**
 * 디바운스 함수 - 일정 시간 동안 함수 호출을 지연시킴
 * @param func 실행할 함수
 * @param delay 지연 시간(ms)
 * @returns 디바운스 처리된 함수
 */
export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	delay: number,
) => {
	let timeoutId: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		return new Promise<ReturnType<T>>((resolve) => {
			timeoutId = setTimeout(() => {
				const result = func(...args);
				resolve(result);
			}, delay);
		});
	};
};
