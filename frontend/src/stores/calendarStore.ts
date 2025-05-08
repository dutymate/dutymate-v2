import { create } from 'zustand';
// import { ScheduleType } from '@/types/ScheduleType';

type CalendarState = {
  schedulesByDate: Record<string, ScheduleType[]>;
  setSchedulesByDate: (date: string, schedules: ScheduleType[]) => void;
};

export type ScheduleType = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  place: string;
  isAllDay: boolean;
};

export const useCalendarStore = create<CalendarState>((set) => ({
  schedulesByDate: {},
  setSchedulesByDate: (date, schedules) =>
    set((state) => ({
      schedulesByDate: { ...state.schedulesByDate, [date]: schedules },
    })),
}));
