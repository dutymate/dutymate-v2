import axiosInstance from '@/lib/axios';

const API = '/duty/my/calendar';

export type ScheduleType = {
  id: string;
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

export const createCalendar = (data: Omit<ScheduleType, 'id'>) =>
  axiosInstance.post(API, data);

export const updateCalendar = (
  calendarId: number,
  data: Omit<ScheduleType, 'id'>
) => axiosInstance.put(`${API}/${calendarId}`, data);

export const deleteCalendar = (calendarId: number) =>
  axiosInstance.delete(`${API}/${calendarId}`);
