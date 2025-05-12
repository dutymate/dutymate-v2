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
    } catch (error) {}
  };

  const handleNextMonth = async () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );
    try {
      await onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } catch (error) {}
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
              const prevMonth = currentMonth - 1 === 0 ? 12 : currentMonth - 1;
              const prevYear =
                currentMonth - 1 === 0 ? currentYear - 1 : currentYear;
              const duty = getDutyFromShifts(
                new Date(prevYear, prevMonth - 1, day),
                day
              );
              const dutyBadge = duty ? (
                <DutyBadgeKor type={duty} size="xs" />
              ) : null;
              return (
                <div
                  key={`prev-${day}`}
                  className={`${isMobile ? 'min-h-[5rem]' : 'min-h-[7.5rem]'} p-2 lg:p-3 relative bg-gray-50 cursor-not-allowed flex flex-col justify-between`}
                >
                  <span className="text-base-muted text-xs lg:text-sm">
                    {day}
                  </span>
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      {dutyBadge}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 현재 달 날짜 - 고정 높이 */}
            {currentMonthDays.map((day) => {
              const isTodayDate = isToday(currentYear, currentMonth, day);
              const holidayName = getHolidayText(day);
              const duty = getDutyFromShifts(
                new Date(currentYear, currentMonth - 1, day),
                day
              );
              const dutyBadge = duty ? (
                <DutyBadgeKor type={duty} size="xs" />
              ) : null;
              const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const schedules = schedulesByDate[dateKey] || [];

              return (
                <div
                  key={`current-${day}`}
                  onClick={() => {
                    const newDate = new Date(
                      currentYear,
                      currentMonth - 1,
                      day
                    );
                    onDateSelect(newDate);
                  }}
                  className={`${isMobile ? 'min-h-[5rem]' : 'min-h-[7.5rem]'} p-2 lg:p-3 relative cursor-pointer hover:bg-gray-50 flex flex-col ${
                    externalSelectedDate &&
                    externalSelectedDate.getDate() === day &&
                    externalSelectedDate.getMonth() === currentMonth - 1
                      ? 'ring-2 ring-primary ring-inset'
                      : ''
                  }`}
                >
                  {/* 날짜 표시 영역 */}
                  <div className="relative flex flex-row items-center">
                    <span
                      className={`w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center ${isTodayDate ? 'bg-primary' : ''} ${getDateStyle(day, isTodayDate)} rounded-full text-xs lg:text-sm`}
                    >
                      {day}
                    </span>
                    {holidayName && (
                      <span className="ml-1 text-[10px] lg:text-[11px] text-red-500 truncate max-w-[80%] line-clamp-1">
                        {holidayName}
                      </span>
                    )}
                  </div>

                  {/* 일정 동그라미 영역 - 제한된 공간 */}
                  <div
                    className={`mt-1 ${isMobile ? 'h-3' : 'h-6'} overflow-hidden`}
                  >
                    <div className="flex flex-wrap gap-[1px] lg:gap-1">
                      {schedules
                        .slice(0, isMobile ? 3 : 10)
                        .map((schedule, index) => (
                          <span
                            key={schedule.calendarId || `temp-${index}`}
                            className={`inline-block rounded-full ${colorClassMap[schedule.color] || 'bg-gray-300'} ${
                              isMobile ? 'w-1 h-1' : 'w-3 h-3'
                            }`}
                            title={schedule.title}
                          />
                        ))}
                      {schedules.length > (isMobile ? 3 : 10) && (
                        <span className="text-[7px] lg:text-[10px] text-gray-500">
                          +{schedules.length - (isMobile ? 3 : 10)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 하단 여백 유지를 위한 빈 공간 */}
                  <div className="flex-grow"></div>

                  {/* DutyBadgeKor */}
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      {dutyBadge}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 다음 달 날짜 */}
            {nextMonthDays.map((day) => {
              const nextMonth = currentMonth + 1 === 13 ? 1 : currentMonth + 1;
              const nextYear =
                currentMonth + 1 === 13 ? currentYear + 1 : currentYear;
              const duty = getDutyFromShifts(
                new Date(nextYear, nextMonth - 1, day),
                day
              );
              const dutyBadge = duty ? (
                <DutyBadgeKor type={duty} size="xs" />
              ) : null;
              return (
                <div
                  key={`next-${day}`}
                  className={`${isMobile ? 'min-h-[5rem]' : 'min-h-[7.5rem]'} p-2 lg:p-3 relative bg-gray-50 cursor-not-allowed flex flex-col justify-between`}
                >
                  <span className="text-base-muted text-xs lg:text-sm">
                    {day}
                  </span>
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right">
                      {dutyBadge}
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
