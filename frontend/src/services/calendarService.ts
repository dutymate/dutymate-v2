import axiosInstance from '@/lib/axios';

const API = '/duty/my/calendar';

export type ScheduleType = {
  calendarId: number;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  place: string;
  isAllDay: boolean;
};

export const getCalendarById = (calendarId: number) =>
  axiosInstance.get(`${API}/${calendarId}`);

export const getCalendarsByDate = (date: string) =>
  axiosInstance.get(`${API}?date=${date}`);

export const createCalendar = (data: Omit<ScheduleType, 'calendarId'>) =>
  axiosInstance.post(API, data);

export const updateCalendar = (
  calendarId: number,
  data: Omit<ScheduleType, 'calendarId'>
) => axiosInstance.put(`${API}/${calendarId}`, data);

export const deleteCalendar = (calendarId: number) => {
  return axiosInstance.delete(`${API}/${calendarId}`);
};
