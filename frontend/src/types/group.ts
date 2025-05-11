export interface Group {
  groupId: number;
  groupName: string;
  groupDescription: string;
  groupMemberCount?: number;
  groupImg?: string | null | undefined;
  shifts?: ShiftDay[];
  dutyData?: {
    year: number;
    month: number;
    shifts: string;
    prevShifts: string;
    nextShifts: string;
  };
}

export interface GroupMember {
  memberId: number;
  name: string;
  isLeader?: boolean;
  createdAt?: string;
  duty?: DutyType;
}

export interface ShiftMember {
  memberId: number;
  name: string;
  duty: DutyType;
}

export interface ShiftDay {
  date: string;
  memberList: ShiftMember[];
}

export type DutyType = 'D' | 'E' | 'N' | 'O' | 'M' | 'X';

export interface DutyInfo {
  member: GroupMember;
  duty: DutyType;
}

export interface DayInfo {
  date: number;
  dateStr?: string;
  isPrevMonth?: boolean;
  isCurrentMonth?: boolean;
  isNextMonth?: boolean;
  duties: DutyInfo[];
}
