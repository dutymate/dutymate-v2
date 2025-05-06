import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { convertDutyType } from '@/utils/dutyUtils';
import { useState } from 'react';
import ScheduleEditModal from '@/components/organisms/SheduleEditModal';
import ShiftColorPickerModal from '@/components/organisms/ShiftColorPickerModal';
// 상수를 컴포넌트 외부로 이동
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
type WeekDay = (typeof weekDays)[number];

// 한글 요일 매핑
const koreanWeekDays: Record<WeekDay, string> = {
  SUN: '일요일',
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
  SAT: '토요일',
};

interface TodayShiftModalProps {
  date: Date | null;
  duty: 'day' | 'evening' | 'night' | 'off' | 'mid';
  dutyData: {
    myShift: 'D' | 'E' | 'N' | 'O' | 'X' | 'M';
    otherShifts: {
      grade: number;
      name: string;
      shift: 'D' | 'E' | 'N' | 'O' | 'X' | 'M';
    }[];
  };
  isMobile: boolean;
  onClose?: () => void;
  onDateChange: (newDate: Date) => void;
  loading?: boolean;
}

// 일정 타입 정의
type ScheduleType = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  place: string;
};

const TodayShiftModal = ({
  date,
  duty,
  dutyData,
  isMobile,
  onClose,
  onDateChange,
  // loading = false,
}: TodayShiftModalProps) => {
  if (!date) return null;

  const [activeTab, setActiveTab] = useState<'status' | 'calendar'>('status');
  const [selectedDutyType, setSelectedDutyType] = useState<'day' | 'off' | 'evening' | 'night' | 'mid'>('day');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create'|'view'|'edit'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType|null>(null);
  const [schedules, setSchedules] = useState<ScheduleType[]>([
    {
      id: '1',
      title: '환자 바이탈 사인 체크 (혈압, 맥박, 체온 )',
      startTime: '오전 1:30',
      endTime: '오전 2:30',
      color: 'blue',
      place: '',
    },
    {
      id: '2',
      title: '아들 등원 준비',
      startTime: '오전 6:30',
      endTime: '오전 7:30',
      color: 'green',
      place: '학강초',
    },
  ]);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
  type DutyType = typeof dutyTypes[number];
  const [dutyColors, setDutyColors] = useState<Record<DutyType, string>>({
    day: 'bg-green-100',
    off: 'bg-gray-100',
    evening: 'bg-red-100',
    night: 'bg-indigo-100',
    mid: 'bg-blue-100',
  });

  const handleAddClick = () => {
    setScheduleModalMode('create');
    setSelectedSchedule(null);
    setIsScheduleModalOpen(true);
  };
  
  const handleScheduleClick = (schedule: ScheduleType) => {
    setScheduleModalMode('view');
    setSelectedSchedule(schedule);
    setIsScheduleModalOpen(true);
  };
  
  const handleSave = (data: Omit<ScheduleType, 'id'>) => {
    if (scheduleModalMode === 'create') {
      setSchedules([...schedules, { ...data, id: Date.now().toString() }]);
    } else if (scheduleModalMode === 'edit' && selectedSchedule) {
      setSchedules(schedules.map(s => s.id === selectedSchedule.id ? { ...data, id: selectedSchedule.id } : s));
    }
    setIsScheduleModalOpen(false);
  };
  
  const handleEdit = () => setScheduleModalMode('edit');
  const handleDelete = () => {
    if (selectedSchedule) {
      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
    }
    setIsScheduleModalOpen(false);
  };

  function parseTimeString(timeStr: string) {
    const [period, hm] = timeStr.split(' ');
    let [hour, minute] = hm.split(':').map(Number);
    if (period === '오후' && hour !== 12) hour += 12;
    if (period === '오전' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  const sortedSchedules = [...schedules].sort((a, b) => parseTimeString(a.startTime) - parseTimeString(b.startTime));

  const formatMonth = (month: number) => {
    return month < 10 ? `0${month}` : month;
  };

  const handlePrevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    onDateChange(newDate);
  };

  const modalContent = (
    <div
      className={`bg-white rounded-[1rem] p-[1rem] shadow-sm ${
        isMobile
          ? 'w-full max-w-[25rem] h-[28rem] py-6'
          : 'w-full h-full min-h-[37.5rem]'
      } flex flex-col relative`}
    >
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-[1rem] right-[1rem] z-20"
        >
          <IoMdClose className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* 탭 UI */}
      <div className="flex w-full mb-4 rounded-full overflow-hidden bg-gray-100">
        <button
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === 'status'
              ? 'bg-gray-300 text-gray-900'
              : 'bg-gray-100 text-gray-400'
          }`}
          onClick={() => setActiveTab('status')}
        >
          전체 근무 현황
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === 'calendar'
              ? 'bg-gray-300 text-gray-900'
              : 'bg-gray-100 text-gray-400'
          }`}
          onClick={() => setActiveTab('calendar')}
        >
          캘린더
        </button>
      </div>

      {/* 날짜/타이틀 영역은 공통 */}
      <div className="text-center mb-[0.5rem] lg:mb-[1rem]">
        <div className="flex items-center justify-center gap-[2rem] lg:gap-[4rem] mb-[0.25rem] lg:mb-[0.5rem]">
          <button onClick={handlePrevDay}>
            <IoChevronBack className="w-6 h-6 text-base-muted hover:text-gray-600" />
          </button>
          <h3 className="text-base-foreground text-[1.125rem] font-medium">
            {formatMonth(date.getMonth() + 1)}월 {date.getDate()}일{' '}
            {koreanWeekDays[weekDays[date.getDay()]]}
          </h3>
          <button onClick={handleNextDay}>
            <IoChevronForward className="w-6 h-6 text-base-muted hover:text-gray-600" />
          </button>
        </div>
        {dutyData?.myShift !== 'X' && (
          <div className="inline-block">
            <p className="text-base-foreground text-[1rem] mb-[0.25rem] lg:mb-[0.5rem]">
              오늘의 근무 일정은{' '}
              <span className={`text-duty-${duty} font-medium`}>
                {duty.toUpperCase()}
              </span>{' '}
              입니다!
            </p>
            <div className={`h-1 bg-duty-${duty}-bg w-full`} />
          </div>
        )}
      </div>
      <div className="border-t border-gray-900 mb-[0.25rem] lg:mb-[0.5rem]" />

      {/* 탭별 내용 분기 */}
      {activeTab === 'status' ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-[0.0625rem] lg:space-y-[0.125rem]">
            {dutyData?.otherShifts
              ?.sort((a, b) => {
                const dutyOrder = {
                  D: 0, // day
                  E: 1, // evening
                  N: 2, // night
                  O: 3, // off
                  X: 4, // 근무 없음
                  M: 5, // mid
                };
                return dutyOrder[a.shift] - dutyOrder[b.shift];
              })
              .map((nurse, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-[0.0625rem] lg:py-[0.125rem]"
                >
                  <div className="flex items-center gap-[0.25rem] lg:gap-[0.5rem] flex-1 min-w-0">
                    <span
                      className="text-base-foreground w-[6rem] truncate text-[0.875rem]"
                      title={nurse.name}
                    >
                      {nurse.name}
                    </span>
                    <span className="text-base-foreground text-center flex-1 text-[0.875rem] whitespace-nowrap">
                      {nurse.grade}년차
                    </span>
                  </div>
                  {nurse.shift !== 'X' ? (
                    <div>
                      <DutyBadgeKor
                        type={convertDutyType(nurse.shift)}
                        size="xxs"
                      />
                    </div>
                  ) : (
                    <div className="w-[4.0625rem] h-[1.875rem]" />
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* 근무 종류 뱃지 두 줄 배치 (2개/3개) */}
          <div className="w-full mb-3 p-3 rounded-xl bg-gray-100 flex flex-col items-center justify-center">
            <div className="flex justify-center gap-2 mb-2">
              {(['day', 'off'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDutyType(type)}
                  className={`rounded-lg focus:outline-none transition-all border-2 px-0.5 py-0.5 ${
                    selectedDutyType === type
                      ? 'border-duty-' + type + ' shadow-duty-' + type + ' ring-2 ring-duty-' + type
                      : 'border-transparent'
                  }`}
                  style={{ lineHeight: 0 }}
                >
                  <span className={dutyColors[type]}>
                    <DutyBadgeKor type={type} size="xs" />
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {(['evening', 'night', 'mid'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDutyType(type)}
                  className={`rounded-lg focus:outline-none transition-all border-2 px-0.5 py-0.5 ${
                    selectedDutyType === type
                      ? 'border-duty-' + type + ' shadow-duty-' + type + ' ring-2 ring-duty-' + type
                      : 'border-transparent'
                  }`}
                  style={{ lineHeight: 0 }}
                >
                  <span className={dutyColors[type]}>
                    <DutyBadgeKor type={type} size="xs" />
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* 일정 리스트 */}
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto mb-2">
            {sortedSchedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => handleScheduleClick(schedule)}
              >
                <div className="flex flex-col items-end min-w-[3.5rem]">
                  <span className="text-xs text-gray-500">{schedule.startTime}</span>
                  <span className="text-xs text-gray-400">{schedule.endTime}</span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg px-2 py-1 text-sm font-medium">
                  {schedule.title}
                </div>
              </div>
            ))}
          </div>
          {/* +버튼, 근무 색상 변경 버튼 */}
          <div className="flex gap-2">
            <button
              className="flex-1 bg-gray-200 rounded-xl py-2 flex items-center justify-center text-2xl font-bold text-gray-700"
              onClick={handleAddClick}
            >
              +
            </button>
            <button
              className="flex-1 bg-gray-200 rounded-xl py-2 text-gray-700 font-medium"
              onClick={() => setIsColorModalOpen(true)}
            >
              근무 색상 변경
            </button>
          </div>
          {/* 모달 */}
          {isScheduleModalOpen && (
            <ScheduleEditModal
              mode={scheduleModalMode}
              initialData={selectedSchedule ?? undefined}
              onClose={() => setIsScheduleModalOpen(false)}
              onSave={handleSave}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-[1rem]"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {modalContent}
      </div>
    );
  }

  return (
    <>
      {modalContent}
      <ShiftColorPickerModal
        open={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        dutyColors={dutyColors}
        onChange={setDutyColors}
      />
    </>
  );
};

export default TodayShiftModal;
