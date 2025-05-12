import axiosInstance from '@/lib/axios';

const API = '/duty/my/calendar';

export type ScheduleType = {
  calendarId: number;
  title: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  color: string;
  place: string;
  isAllDay: boolean;
};

export type CalendarCreateRequest = {
  title: string;
  date: string;
  place: string;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
};

//캘린더 상세 조회하기 (ㅇㅇ)
export const getCalendarById = (calendarId: number) =>
  axiosInstance.get(`${API}/${calendarId}`);

//캘린더 날짜별 조회하기 ()
export const getCalendarsByDate = (date: string) =>
  axiosInstance.get(`${API}?date=${date}`);

//캘린더 생성하기 (o)
export const createCalendar = (data: CalendarCreateRequest) =>
  axiosInstance.post(API, data);

//캘린더 수정하기
export const updateCalendar = (
  calendarId: number,
  data: CalendarCreateRequest
) => axiosInstance.put(`${API}/${calendarId}`, data);

//캘린더 삭제하기
export const deleteCalendar = (calendarId: number) => {
  return axiosInstance.delete(`${API}/${calendarId}`);
};

/**
 * 날짜별 일정(메모) 데이터를 fetch하는 함수 (axiosInstance 사용)
 * @param date Date 객체 (예: new Date())
 * @returns Promise<ScheduleType[]> (성공 시 일정 배열, 실패 시 빈 배열)
 */
export const fetchSchedules = async (date: Date): Promise<ScheduleType[]> => {
  try {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const response = await axiosInstance.get(
      `/duty/my/calendar?date=${dateKey}`
    );
    // response.data가 배열이면 바로 반환, success/data 구조면 data.data 반환
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (
      response.data &&
      response.data.success &&
      Array.isArray(response.data.data)
    ) {
      return response.data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return [];
  }
};
