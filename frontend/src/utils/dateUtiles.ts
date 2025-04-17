export const formatTimeAgo = (dateString: string) => {
	const date = dateString ? new Date(dateString) : new Date();
	const now = new Date();

	// 날짜 변환에 실패한 경우
	if (isNaN(date.getTime())) {
		return "방금";
	}

	const diffInMinutes = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60),
	);

	if (diffInMinutes === 0) {
		return "방금";
	} else if (diffInMinutes < 60) {
		return `${diffInMinutes}분 전`;
	} else {
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) {
			return `${diffInHours}시간 전`;
		} else {
			const diffInDays = Math.floor(diffInHours / 24);
			return `${diffInDays}일 전`;
		}
	}
};
