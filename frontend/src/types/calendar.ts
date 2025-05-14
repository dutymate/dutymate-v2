export interface Calendar {
  prevCalendar: CalendarEvent[];
  currCalendar: CalendarEvent[];
  nextCalendar: CalendarEvent[];
}

export interface CalendarEvent {
  date: string;
  title: string;
  color: string;
}
