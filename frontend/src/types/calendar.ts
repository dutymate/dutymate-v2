export interface Calendar {
  prevCalendar: CalendarEvent[];
  currCalendar: CalendarEvent[];
  nextCalendar: CalendarEvent[];
}

export interface CalendarEvent {
  calendarId: number;
  date: string;
  title: string;
  color: string;
}
