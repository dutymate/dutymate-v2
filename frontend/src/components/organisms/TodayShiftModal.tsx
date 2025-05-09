import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { convertDutyType } from '@/utils/dutyUtils';
import { useState } from 'react';
import ScheduleEditModal from '@/components/organisms/ScheduleEditModal';
import ShiftColorPickerModal from '@/components/organisms/ShiftColorPickerModal';
// 상수를 컴포넌트 외부로 이동
import { createCalendar, deleteCalendar } from '@/services/calendarService';
import type { ScheduleType } from '@/services/calendarService';
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
  schedulesByDate: Record<string, ScheduleType[]>;
  setSchedulesByDate: React.Dispatch<
    React.SetStateAction<Record<string, ScheduleType[]>>
  >;
  activeTab: 'status' | 'calendar';
  onTabChange: (tab: 'status' | 'calendar') => void;
  selectedDutyType: 'day' | 'off' | 'evening' | 'night' | 'mid';
  onDutyTypeChange: (type: 'day' | 'off' | 'evening' | 'night' | 'mid') => void;
}

const colorClassMap: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  tomato: 'bg-orange-500',
  indigo: 'bg-indigo-500',
};

const TodayShiftModal = ({
  date,
  duty,
  dutyData,
  isMobile,
  onClose,
  onDateChange,
  schedulesByDate,
  setSchedulesByDate,
  activeTab,
  onTabChange,
  selectedDutyType,
  onDutyTypeChange,
}: TodayShiftModalProps) => {
  if (!date) return null;

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<
    'create' | 'view' | 'edit'
  >('create');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(
    null
  );
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const schedules = schedulesByDate[dateKey] || [];
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
  type DutyType = (typeof dutyTypes)[number];
  const [dutyColors, setDutyColors] = useState<
    Record<DutyType, { bg: string; text: string }>
  >({
    day: { bg: '#dcfce7', text: '#222222' },
    off: { bg: '#f3f4f6', text: '#222222' },
    evening: { bg: '#fee2e2', text: '#222222' },
    night: { bg: '#e0e7ff', text: '#222222' },
    mid: { bg: '#dbeafe', text: '#222222' },
  });

  const MAX_SCHEDULES_PER_DAY = 10;

  const handleAddClick = () => {
    if (schedules.length >= MAX_SCHEDULES_PER_DAY) {
      alert('하루에 최대 10개의 메모만 추가할 수 있습니다.');
      return;
    }
    setScheduleModalMode('create');
    setSelectedSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleClick = (schedule: ScheduleType) => {
    setScheduleModalMode('view');
    setSelectedSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSchedule?.calendarId) {
      console.log('삭제할 schedule이 없습니다:', selectedSchedule);
      return;
    }
    try {
      console.log('삭제 시도 calendarId:', selectedSchedule.calendarId);
      await deleteCalendar(Number(selectedSchedule.calendarId));

      // 삭제 후 데이터 다시 가져오기
      const date = new Date(selectedSchedule.startTime);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // 해당 날짜의 일정을 모두 제거하고 다시 가져오기
      setSchedulesByDate((prev) => {
        const newSchedules = { ...prev };
        delete newSchedules[dateKey];
        return newSchedules;
      });

      // 일정 목록 다시 가져오기
      try {
        const response = await fetch(`/api/calendar?date=${dateKey}`);
        const data = await response.json();
        if (data.success) {
          setSchedulesByDate((prev) => ({
            ...prev,
            [dateKey]: data.data,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch updated schedules:', error);
      }

      setIsScheduleModalOpen(false);
      onClose?.();
    } catch (e) {
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const handleSave = async (data: Omit<ScheduleType, 'calendarId'>) => {
    try {
      const response = await createCalendar(data);
      // API 응답에서 생성된 일정 데이터를 받아옵니다
      const newSchedule = response.data;

      // schedulesByDate 상태를 업데이트합니다
      setSchedulesByDate((prev) => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newSchedule],
      }));

      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('일정 저장에 실패했습니다.');
    }
  };

  const handleEdit = () => setScheduleModalMode('edit');

  function parseTimeString(timeStr: string) {
    if (!timeStr) return 0;

    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.getHours() * 60 + date.getMinutes();
    }

    const [period, hm] = timeStr.split(' ');
    let [hour, minute] = hm.split(':').map(Number);
    if (period === '오후' && hour !== 12) hour += 12;
    if (period === '오전' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // 정렬: 하루종일 메모가 항상 위에 오도록, 하루종일끼리는 순서 유지, 나머지는 시간순
  const sortedSchedules = [
    ...schedules.filter((s) => s.isAllDay),
    ...[...schedules.filter((s) => !s.isAllDay)].sort(
      (a, b) => parseTimeString(a.startTime) - parseTimeString(b.startTime)
    ),
  ];

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

  function formatTimeForDisplay(timeStr: string) {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      let hour = date.getHours();
      const minute = date.getMinutes();
      const period = hour < 12 ? '오전' : '오후';
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
      return `${period} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    return timeStr;
  }

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
      <div className="flex w-full mb-4 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
        <button
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === 'status'
              ? 'bg-white text-primary border-b-2 border-primary'
              : 'bg-white text-gray-400'
          }`}
          onClick={() => onTabChange('status')}
        >
          전체 근무 현황
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === 'calendar'
              ? 'bg-white text-primary border-b-2 border-primary'
              : 'bg-white text-gray-400'
          }`}
          onClick={() => onTabChange('calendar')}
        >
          캘린더
        </button>
      </div>

      {/* 날짜/타이틀 영역은 공통 */}
      <div className="text-center mb-[0.5rem] lg:mb-[1rem] shrink-0">
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
      <div className="border-t border-gray-900 mb-[0.25rem] lg:mb-[0.5rem] shrink-0" />

      {/* 탭별 내용 분기 */}
      <div className="flex-1 flex flex-col min-h-0">
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
          <>
            {/* 근무 종류 뱃지: 모바일은 한 줄, 네모 작게 / 웹은 기존대로 */}
            <div
              className={`w-full ${isMobile ? 'mb-2 p-1 rounded-lg' : 'mb-3 p-3 rounded-xl'} bg-gray-100 flex ${isMobile ? 'flex-row justify-center gap-1' : 'flex-col items-center justify-center'} shrink-0`}
            >
              {isMobile ? (
                <div className="flex flex-row flex-wrap justify-center gap-1 w-full">
                  {(['day', 'off', 'evening', 'night', 'mid'] as const).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onDutyTypeChange(type)}
                        className={`rounded-lg focus:outline-none transition-all border-2 px-0.5 py-0.5 ${
                          selectedDutyType === type
                            ? 'border-duty-' +
                              type +
                              ' shadow-duty-' +
                              type +
                              ' ring-2 ring-duty-' +
                              type
                            : 'border-transparent'
                        }`}
                        style={{ lineHeight: 0 }}
                      >
                        <span className={dutyColors[type].bg}>
                          <DutyBadgeKor type={type} size="xxs" />
                        </span>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-2 mb-2">
                    {(['day', 'off'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onDutyTypeChange(type)}
                        className={`rounded-lg focus:outline-none transition-all border-2 px-0.5 py-0.5 ${
                          selectedDutyType === type
                            ? 'border-duty-' +
                              type +
                              ' shadow-duty-' +
                              type +
                              ' ring-2 ring-duty-' +
                              type
                            : 'border-transparent'
                        }`}
                        style={{ lineHeight: 0 }}
                      >
                        <span className={dutyColors[type].bg}>
                          <DutyBadgeKor type={type} size="xxs" />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-2">
                    {(['evening', 'night', 'mid'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onDutyTypeChange(type)}
                        className={`rounded-lg focus:outline-none transition-all border-2 px-0.5 py-0.5 ${
                          selectedDutyType === type
                            ? 'border-duty-' +
                              type +
                              ' shadow-duty-' +
                              type +
                              ' ring-2 ring-duty-' +
                              type
                            : 'border-transparent'
                        }`}
                        style={{ lineHeight: 0 }}
                      >
                        <span className={dutyColors[type].bg}>
                          <DutyBadgeKor type={type} size="xxs" />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* 일정 리스트 */}
            <div
              className={`flex flex-col gap-2 flex-1 overflow-y-auto mb-2 ${isMobile ? 'max-h-[10rem]' : 'max-h-[28rem]'}`}
            >
              {sortedSchedules.map((schedule) => (
                <div
                  key={schedule.calendarId}
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  {/* 색상 동그라미 */}
                  <span
                    className={`w-3 h-3 rounded-full mt-2 ${colorClassMap[schedule.color] || 'bg-gray-300'}`}
                  />
                  {/* 시간 or 종일 */}
                  <div
                    className="relative min-w-[3.5rem] flex flex-col items-end justify-center"
                    style={{ height: '2.25rem' }}
                  >
                    {schedule.isAllDay ? (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-2.5 text-xs text-primary font-bold">
                        종일
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500">
                          {formatTimeForDisplay(schedule.startTime)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeForDisplay(schedule.endTime)}
                        </span>
                      </>
                    )}
                  </div>
                  {/* 제목 */}
                  <div className="flex-1 bg-gray-50 rounded-lg px-2 py-1 text-sm font-medium">
                    {schedule.title}
                  </div>
                </div>
              ))}
            </div>
            {/* +버튼, 근무 색상 변경 버튼 */}
            <div
              className={`flex gap-2 shrink-0 sm:absolute sm:bottom-0 sm:left-0 sm:w-full sm:bg-white sm:p-4 sm:z-10 sm:border-t sm:border-gray-200 rounded-b-[1rem]`}
            >
              <button
                className="flex-1 bg-white border border-gray-200 rounded-xl py-2 flex items-center justify-center text-2xl font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                onClick={handleAddClick}
                disabled={schedules.length >= MAX_SCHEDULES_PER_DAY}
                style={
                  schedules.length >= MAX_SCHEDULES_PER_DAY
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
                }
              >
                +
              </button>
              <button
                className="flex-1 bg-white border border-gray-200 rounded-xl py-2 text-primary font-medium shadow-sm hover:bg-primary hover:text-white transition-colors"
                onClick={() => setIsColorModalOpen(true)}
              >
                근무 색상 변경
              </button>
            </div>
          </>
        )}
      </div>
      {/* 모달 */}
      {isScheduleModalOpen && (
        <ScheduleEditModal
          mode={scheduleModalMode}
          initialData={selectedSchedule ?? undefined}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSave}
          onEdit={handleEdit}
          onDelete={() => {
            console.log('삭제 버튼 클릭됨 (모달 내부)');
            handleDelete();
          }}
          currentScheduleCount={schedules.length}
          setSchedulesByDate={setSchedulesByDate}
        />
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
