// 요일 상수
export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

// 한글 요일 상수
export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 특정 날짜의 요일을 반환합니다 (0: 일요일, 6: 토요일)
export const getDayOfWeek = (year: number, month: number, day: number): number => {
  return new Date(year, month - 1, day).getDay();
};

// 특정 날짜의 영문 요일을 반환합니다
export const getDayOfWeekEng = (year: number, month: number, day: number): string => {
  const dayIndex = getDayOfWeek(year, month, day);
  return WEEKDAYS[dayIndex];
};

// 특정 날짜의 한글 요일을 반환합니다
export const getDayOfWeekKo = (year: number, month: number, day: number): string => {
  const dayIndex = getDayOfWeek(year, month, day);
  return WEEKDAYS_KO[dayIndex];
};

// 특정 날짜가 토요일인지 확인합니다.
export const isSaturday = (year: number, month: number, day: number): boolean => {
  return getDayOfWeek(year, month, day) === 6;
};

// 특정 날짜가 일요일인지 확인합니다.
export const isSunday = (year: number, month: number, day: number): boolean => {
  return getDayOfWeek(year, month, day) === 0;
};

// 특정 날짜가 주말인지 확인합니다.
export const isWeekend = (year: number, month: number, day: number): boolean => {
  const dayOfWeek = getDayOfWeek(year, month, day);
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// 해당 월의 모든 주말 날짜를 반환합니다.
export const getWeekendDays = (year: number, month: number): number[] => {
  const weekendDays: number[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    if (isWeekend(year, month, day)) {
      weekendDays.push(day);
    }
  }
  return weekendDays;
};

// 해당 월의 기본 OFF 일수를 계산합니다.
// 주말(토,일)의 총 개수를 반환합니다.
export const getDefaultOffDays = (year: number, month: number): number => {
  return getWeekendDays(year, month).length;
};

// 특정 월의 첫 날짜를 반환합니다.
export const getFirstDayOfMonth = (year: number, month: number): Date => {
  return new Date(year, month - 1, 1);
};

// 특정 월의 마지막 날짜를 반환합니다.
export const getLastDayOfMonth = (year: number, month: number): Date => {
  return new Date(year, month, 0);
};

// 특정 월의 이전 달의 마지막 날짜를 반환합니다.
export const getPrevMonthLastDay = (year: number, month: number): Date => {
  return new Date(year, month - 1, 0);
};

// 캘린더에 표시할 이전 달의 날짜들을 계산합니다.
export const getPrevMonthDays = (year: number, month: number): number[] => {
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthLastDay = getPrevMonthLastDay(year, month);
  const days = [];
  
  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    days.push(prevMonthLastDay.getDate() - i);
  }
  
  return days;
};

// 캘린더에 표시할 다음 달의 날짜들을 계산합니다.
export const getNextMonthDays = (year: number, month: number): number[] => {
  const lastDay = getLastDayOfMonth(year, month);
  const days = [];
  
  for (let i = 1; i <= 6 - lastDay.getDay(); i++) {
    days.push(i);
  }
  
  return days;
};

// 특정 월의 모든 날짜를 배열로 반환합니다.
export const getCurrentMonthDays = (year: number, month: number): number[] => {
  const lastDay = getLastDayOfMonth(year, month);
  return Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);
};

// 오늘 날짜인지 확인합니다.
export const isToday = (year: number, month: number, day: number): boolean => {
  const today = new Date();
  return (
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear()
  );
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

export const formatTimeAgo = (dateString: string) => {
  try {
    const date = dateString ? new Date(dateString) : new Date();
    const now = new Date();

    // 날짜 변환에 실패한 경우
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return '방금';
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30.44); // 평균 월 길이 사용
    const diffInYears = Math.floor(diffInDays / 365);

    // 1분 미만
    if (diffInSeconds < 60) {
      return '방금';
    }
    // 1시간 미만
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }
    // 24시간 미만
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }
    // 7일 미만
    if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    }
    // 4주 미만
    if (diffInWeeks < 4) {
      return `${diffInWeeks}주 전`;
    }
    // 12개월 미만
    if (diffInMonths < 12) {
      return `${diffInMonths}개월 전`;
    }
    // 1년 이상
    return `${diffInYears}년 전`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '방금';
  }
};

// 특정 월의 총 일수를 반환합니다
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};
