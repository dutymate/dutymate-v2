import { useEffect, useState } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

import { Button } from '@/components/atoms/Button';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import ReqShiftModal from '@/components/organisms/ReqShiftModal';
import {
  WEEKDAYS,
  getCurrentMonthDays,
  getNextMonthDays,
  getPrevMonthDays,
  isToday,
  getDayOfWeek,
  isHoliday,
  getHolidayInfo,
} from '@/utils/dateUtils';
import { useHolidayStore } from '@/stores/holidayStore';
import type { ScheduleType } from '@/services/calendarService';

interface MyShiftCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  dutyData: {
    year: number;
    month: number;
    prevShifts: string;
    nextShifts: string;
    shifts: string;
  } | null;
  onMonthChange?: (year: number, month: number) => void;
  schedulesByDate: Record<string, ScheduleType[]>;
  colorClassMap: Record<string, string>;
  setSchedulesByDate: React.Dispatch<
    React.SetStateAction<Record<string, ScheduleType[]>>
  >;
  onClose?: () => void;
}

const MyShiftCalendar = ({
  onDateSelect,
  selectedDate: externalSelectedDate,
  dutyData,
  onMonthChange,
  schedulesByDate,
  colorClassMap,
  setSchedulesByDate,
}: MyShiftCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // lg 브레이크포인트
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const fetchHolidays = useHolidayStore((state) => state.fetchHolidays);
  // const [selectedSchedule] = useState<ScheduleType | null>(null);

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 공휴일 데이터 불러오기
  useEffect(() => {
    fetchHolidays(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, fetchHolidays]);

  const handlePrevMonth = async () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1
    );
    try {
      await onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } catch (error) {
      console.error('Failed to fetch duty data:', error);
    }
  };

  const handleNextMonth = async () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );
    try {
      await onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } catch (error) {
      console.error('Failed to fetch duty data:', error);
    }
  };

  // 실제 근무 데이터로부터 듀티 가져오기
  const getDutyFromShifts = (
    date: Date,
    day: number
  ): 'day' | 'evening' | 'night' | 'off' | 'mid' | null => {
    if (!dutyData) return null;

    const currentMonth = currentDate.getMonth() + 1;
    const targetMonth = date.getMonth() + 1;
    const prevMonthLastDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    ).getDate();

    let shift: string | undefined;
    if (targetMonth < currentMonth) {
      // 이전 달의 마지막 주
      const prevShiftsLength = dutyData.prevShifts.length;
      const index = prevShiftsLength - (prevMonthLastDate - day + 1);
      shift = dutyData.prevShifts[index];
    } else if (targetMonth > currentMonth) {
      // 다음 달의 첫 주
      // day가 1부터 시작하므로 인덱스 조정이 필요 없음
      shift = dutyData.nextShifts[day - 1];
      // 다음 달의 첫 주차만 표시하도록 제한
      if (day > dutyData.nextShifts.length) {
        return null;
      }
    } else {
      // 현재 달
      shift = dutyData.shifts[day - 1];
    }

    // shift가 undefined이거나 'X'인 경우 null 반환
    if (!shift || shift === 'X') return null;

    const dutyMap: Record<
      string,
      'day' | 'evening' | 'night' | 'off' | 'mid' | null
    > = {
      D: 'day',
      E: 'evening',
      N: 'night',
      O: 'off',
      M: 'mid',
      X: null,
    };

    return dutyMap[shift] || null;
  };

  // getFixedDuty 함수를 getDutyFromShifts로 교체
  useEffect(() => {
    if (dutyData) {
      setCurrentDate(new Date(dutyData.year, dutyData.month - 1));
    }
  }, [dutyData?.year, dutyData?.month]);

  // 달력 데이터 계산
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const prevMonthDays = getPrevMonthDays(currentYear, currentMonth);
  const currentMonthDays = getCurrentMonthDays(currentYear, currentMonth);
  const nextMonthDays = getNextMonthDays(currentYear, currentMonth);

  // 날짜 스타일 결정 함수
  const getDateStyle = (day: number, isTodayDate: boolean) => {
    // 오늘 날짜인 경우 항상 흰색 텍스트 (배경이 primary 색상)
    if (isTodayDate) return 'text-white';

    const isHolidayDate = isHoliday(currentYear, currentMonth, day);
    const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);

    // 공휴일이거나 일요일인 경우 빨간색
    if (isHolidayDate || dayOfWeek === 0) return 'text-red-500';
    // 토요일은 파란색
    if (dayOfWeek === 6) return 'text-blue-500';
    // 평일은 기본 텍스트 색상
    return 'text-gray-900';
  };

  // 공휴일 정보 가져오기
  const getHolidayText = (day: number) => {
    const holidayInfo = getHolidayInfo(currentYear, currentMonth, day);
    return holidayInfo?.name || null;
  };

  // 일정 삭제 함수 추가
  const handleDeleteSchedule = (dateKey: string, calendarId: number) => {
    setSchedulesByDate((prev) => ({
      ...prev,
      [dateKey]:
        prev[dateKey]?.filter(
          (schedule) => schedule.calendarId !== calendarId
        ) || [],
    }));
  };

  // 일정 수정 함수 추가
  const handleUpdateSchedule = (
    dateKey: string,
    updatedSchedule: ScheduleType
  ) => {
    setSchedulesByDate((prev) => ({
      ...prev,
      [dateKey]:
        prev[dateKey]?.map((schedule) =>
          schedule.calendarId === updatedSchedule.calendarId
            ? updatedSchedule
            : schedule
        ) || [],
    }));
  };

  return (
    <div className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-1 pt-4 sm:p-6 h-full">
      <div className="grid grid-cols-3 items-center mb-4 px-2">
        {/* 왼쪽 - 빈 공간 */}
        <div className="col-start-1"></div>

        {/* 중앙 - 연월 표시 */}
        <div className="col-start-2 flex items-center justify-center gap-2 md:gap-4">
          <button
            onClick={handlePrevMonth}
            className="text-base-muted hover:text-base-foreground"
          >
            <IoIosArrowBack className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </button>
          <h2
            className={`text-base-foreground ${
              isMobile ? 'text-[0.875rem]' : 'text-[1rem]'
            } font-medium whitespace-nowrap`}
          >
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={handleNextMonth}
            className="text-base-muted hover:text-base-foreground"
          >
            <IoIosArrowForward
              className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
            />
          </button>
        </div>

        {/* 오른쪽 - 근무 요청 버튼 */}
        <div className="col-start-3 flex justify-end shrink-0">
          <Button
            color="primary"
            className={`whitespace-nowrap ${
              isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-2 text-sm'
            }`}
            onClick={() => setIsReqModalOpen(true)}
            size={isMobile ? 'xs' : 'md'}
          >
            근무 요청
          </Button>
        </div>
      </div>

      <div className={`${isMobile ? '' : 'flex gap-[2rem]'}`}>
        <div
          className={`bg-white rounded-[1rem] ${
            isMobile ? 'w-full p-[0.25rem]' : 'w-full p-[0.5rem]'
          }`}
        >
          {/* 달력 헤더 */}
          <div className="grid grid-cols-7 mb-[0.25rem]">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`text-center text-[0.875rem] font-medium ${
                  index === 0
                    ? 'text-red-500'
                    : index === 6
                      ? 'text-blue-500'
                      : 'text-gray-900'
                }`}
              >
                <span translate="no">{WEEKDAYS[index]}</span>
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 border border-gray-100">
            {/* 이전 달 날짜 */}
            {prevMonthDays.map((day) => {
              const dayOfWeek = getDayOfWeek(
                currentYear,
                currentMonth - 1,
                day
              );
              return (
                <div
                  key={`prev-${day}`}
                  className={`
                    min-h-[80px] lg:min-h-[120px] 
                    p-2 lg:p-3 
                    relative bg-gray-50 cursor-not-allowed
                  `}
                >
                  <span
                    className={`
                    text-base-muted text-xs lg:text-sm 
                    absolute top-1 lg:top-2 left-1 lg:left-2
                    ${
                      dayOfWeek === 0
                        ? 'text-red-500/50'
                        : dayOfWeek === 6
                          ? 'text-blue-500/50'
                          : 'text-base-muted'
                    }
                  `}
                  >
                    {day}
                  </span>
                  {getDutyFromShifts(
                    new Date(currentYear, currentMonth - 2, day),
                    day
                  ) && (
                    <div className="absolute bottom-0.5 right-0.5 lg:bottom-1 lg:right-1 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      <DutyBadgeKor
                        type={
                          getDutyFromShifts(
                            new Date(currentYear, currentMonth - 2, day),
                            day
                          )!
                        }
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* 현재 달 날짜 */}
            {currentMonthDays.map((day) => {
              const isTodayDate = isToday(currentYear, currentMonth, day);
              const holidayName = getHolidayText(day);
              const dateStyle = getDateStyle(day, isTodayDate);

              return (
                <div
                  key={day}
                  onClick={() => {
                    const newDate = new Date(
                      currentYear,
                      currentMonth - 1,
                      day
                    );
                    onDateSelect(newDate);
                  }}
                  className={`
                    min-h-[80px] lg:min-h-[120px] 
                    p-2 lg:p-3 
                    relative cursor-pointer hover:bg-gray-50
                    ${
                      externalSelectedDate &&
                      externalSelectedDate.getDate() === day &&
                      externalSelectedDate.getMonth() === currentMonth - 1
                        ? 'ring-2 ring-primary ring-inset'
                        : ''
                    }
                  `}
                >
                  <div className="relative flex flex-row items-center">
                    {/* 날짜 숫자 + 공휴일 텍스트 */}
                    <div className="flex items-center w-full">
                      <span
                        className={`
                          w-6 h-6 lg:w-8 lg:h-8
                          flex items-center justify-center
                          ${isTodayDate ? 'bg-primary' : ''} 
                          ${dateStyle}
                          rounded-full
                          text-xs lg:text-sm
                        `}
                      >
                        {day}
                      </span>
                      {holidayName && (
                        <span className="ml-1 text-[10px] lg:text-[11px] text-red-500 max-w-[3.5em] truncate align-middle">
                          {holidayName}
                        </span>
                      )}
                    </div>
                    {/* 동그라미들: 모바일은 검정색 하나만, 데스크탑은 모두 표시 */}
                    {(() => {
                      const circles = (
                        schedulesByDate?.[
                          `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        ] || []
                      ).slice(0, 10);
                      if (isMobile && circles.length > 0) {
                        return (
                          <div className="flex items-center justify-center gap-1 mt-1 mb-1 w-full">
                            <span className="w-3 h-3 rounded-full inline-block bg-black" />
                          </div>
                        );
                      }
                      return (
                        <div className="flex flex-wrap items-center gap-1 mt-1 mb-1 max-w-full">
                          {circles.map((schedule) => (
                            <span
                              key={schedule.calendarId}
                              className={`w-3 h-3 rounded-full inline-block ${colorClassMap[schedule.color] || 'bg-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSchedule(
                                  `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                                  schedule.calendarId
                                );
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleUpdateSchedule(
                                  `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                                  schedule
                                );
                              }}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {getDutyFromShifts(
                    new Date(currentYear, currentMonth - 1, day),
                    day
                  ) && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      <DutyBadgeKor
                        type={
                          getDutyFromShifts(
                            new Date(currentYear, currentMonth - 1, day),
                            day
                          )!
                        }
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* 다음 달 날짜 */}
            {nextMonthDays.map((day) => {
              const dayOfWeek = getDayOfWeek(
                currentYear,
                currentMonth + 1,
                day
              );
              return (
                <div
                  key={`next-${day}`}
                  className={`
                    min-h-[80px] lg:min-h-[120px] 
                    p-2 lg:p-3 
                    relative bg-gray-50 cursor-not-allowed
                  `}
                >
                  <span
                    className={`
                    text-base-muted text-xs lg:text-sm 
                    absolute top-1 lg:top-2 left-1 lg:left-2
                    ${
                      dayOfWeek === 0
                        ? 'text-red-500/50'
                        : dayOfWeek === 6
                          ? 'text-blue-500/50'
                          : 'text-base-muted'
                    }
                  `}
                  >
                    {day}
                  </span>
                  {getDutyFromShifts(
                    new Date(currentYear, currentMonth, day),
                    day
                  ) && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      <DutyBadgeKor
                        type={
                          getDutyFromShifts(
                            new Date(currentYear, currentMonth, day),
                            day
                          )!
                        }
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 근무 요청 모달 */}
      {isReqModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div onClick={(e) => e.stopPropagation()}>
            <ReqShiftModal onClose={() => setIsReqModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShiftCalendar;
