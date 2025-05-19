import { useEffect, useState, useRef } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { toast } from 'react-toastify';

import { Button } from '@/components/atoms/Button';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import ReqShiftModal from '@/components/organisms/ReqShiftModal';
import WorkCRUDModal from '@/components/organisms/WorkCRUDModal';
import type { ScheduleType } from '@/services/calendarService';
import { useHolidayStore } from '@/stores/holidayStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import {
  WEEKDAYS,
  getCurrentMonthDays,
  getDayOfWeek,
  getHolidayInfo,
  getNextMonthDays,
  getPrevMonthDays,
  isHoliday,
  isToday,
} from '@/utils/dateUtils';
import { getDutyColors } from '@/utils/dutyUtils';
import TodayShiftModal from '@/components/organisms/TodayShiftModal';
import type { MyDuty } from '@/services/dutyService';

interface MyShiftCalendarProps {
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
  dutyData: MyDuty | null;
  onMonthChange?: (year: number, month: number) => void;
  schedulesByDate: Record<string, ScheduleType[]>;
  colorClassMap: Record<string, string>;
  setSchedulesByDate?: React.Dispatch<
    React.SetStateAction<Record<string, ScheduleType[]>>
  >;
  onClose?: () => void;
  dutyColors?: Record<string, { bg: string; text: string }>;
  dutyBadges?: Record<string, JSX.Element>;
  setMyDutyData: React.Dispatch<React.SetStateAction<MyDuty | null>>;
  refreshMyDutyData?: () => void;
  onWorkCRUDModalOpen?: () => void;
  isWorkInputMode?: boolean;
  onWorkInputClick?: () => void;
}

const typeToShiftCode = (
  type: 'day' | 'evening' | 'night' | 'off' | 'mid' | 'X'
): 'D' | 'E' | 'N' | 'O' | 'M' | 'X' => {
  switch (type) {
    case 'day':
      return 'D';
    case 'evening':
      return 'E';
    case 'night':
      return 'N';
    case 'off':
      return 'O';
    case 'mid':
      return 'M';
    case 'X':
      return 'X';
    default:
      return 'X';
  }
};

const MyShiftCalendar = ({
  onDateSelect,
  selectedDate: externalSelectedDate,
  dutyData,
  onMonthChange,
  schedulesByDate,
  colorClassMap,
  dutyColors: externalDutyColors,
  setMyDutyData,
  refreshMyDutyData,
  onWorkCRUDModalOpen,
  isWorkInputMode: externalWorkInputMode,
  onWorkInputClick,
}: MyShiftCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // lg 브레이크포인트
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isWorkInputMode, setIsWorkInputMode] = useState(false);
  const [isTodayShiftModalOpen, setIsTodayShiftModalOpen] = useState(false);
  const [workInputSelectedDate, setWorkInputSelectedDate] =
    useState<Date | null>(null);
  const fetchHolidays = useHolidayStore((state) => state.fetchHolidays);
  const { userInfo } = useUserAuthStore();
  const hasWard = userInfo?.existMyWard;
  const calendarGridRef = useRef<HTMLDivElement>(null);
  // 날짜 셀 refs
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // dutyColors가 전달되지 않은 경우 기본값 설정
  const defaultDutyColors =
    externalDutyColors || getDutyColors(userInfo?.color);

  // 외부에서 전달된 isWorkInputMode 값을 사용
  useEffect(() => {
    if (externalWorkInputMode !== undefined) {
      setIsWorkInputMode(externalWorkInputMode);
    }
  }, [externalWorkInputMode]);

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
      if (index >= 0 && index < prevShiftsLength) {
        shift = dutyData.prevShifts[index];
      }
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

  // 일정을 타입별로 정렬
  const sortSchedules = (schedules: ScheduleType[]) => {
    return [...schedules].sort((a, b) => {
      // 하루종일 일정 먼저
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;

      // 시간별 정렬 (시작 시간 기준)
      if (!a.isAllDay && !b.isAllDay) {
        const aTime = a.startTime || '';
        const bTime = b.startTime || '';
        return aTime.localeCompare(bTime);
      }

      return 0;
    });
  };

  const handleDutyTypeChange = (dutyType: string) => {
    if (!dutyData || !externalSelectedDate) return;
    const dayIdx = externalSelectedDate.getDate() - 1;
    const newShifts = dutyData.shifts.split('');
    newShifts[dayIdx] = typeToShiftCode(
      dutyType as 'day' | 'evening' | 'night' | 'off' | 'mid' | 'X'
    );
    setMyDutyData({ ...dutyData, shifts: newShifts.join('') });
  };

  // 근무 입력 버튼 클릭 핸들러
  const handleWorkInputButtonClick = () => {
    if (onWorkInputClick) {
      onWorkInputClick();
    } else {
      setIsWorkInputMode(!isWorkInputMode);
      toast.info('날짜를 선택하세요');
    }
  };

  // 날짜 클릭 핸들러 수정
  const handleDateClick = (
    newDate: Date,
    _event: React.MouseEvent<HTMLDivElement>,
    idx: number
  ) => {
    if (isWorkInputMode) {
      // 선택한 셀을 중앙에 오도록 스크롤
      if (cellRefs.current[idx]) {
        cellRefs.current[idx]?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
      // 근무 입력 모드에서는 onDateSelect만 호출하고 상위 컴포넌트에서 처리
      onDateSelect(newDate);
      // 부모의 onWorkCRUDModalOpen이 있으면 호출
      if (onWorkCRUDModalOpen) {
        onWorkCRUDModalOpen();
      }
    } else {
      onDateSelect(newDate);
      // 근무 입력 모드가 아닐 때만 TodayShiftModal 표시
      setIsTodayShiftModalOpen(true);
    }
  };

  // 모바일에서 selectedDate가 변경될 때마다 해당 날짜 셀로 자동 스크롤
  useEffect(() => {
    if (isMobile && externalSelectedDate && isWorkInputMode) {
      // 현재 보이는 날짜들 중에서 선택된 날짜 찾기
      const dateKey = `${externalSelectedDate.getFullYear()}-${String(externalSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(externalSelectedDate.getDate()).padStart(2, '0')}`;

      // 모든 날짜 셀 중에서 해당 날짜 찾기
      const idx = cellRefs.current.findIndex(
        (ref) => ref?.getAttribute('data-date') === dateKey
      );

      if (idx !== -1 && cellRefs.current[idx]) {
        // 찾은 셀을 중앙에 오도록 스크롤
        cellRefs.current[idx]?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [externalSelectedDate, isMobile, isWorkInputMode]);

  return (
    <div
      className={`bg-white ${isMobile ? '' : 'rounded-[0.92375rem]'} h-full ${isMobile ? 'pt-4' : 'pt-4 px-0'} ${isMobile ? 'overflow-visible' : 'overflow-hidden'} w-full`}
    >
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

        {/* 오른쪽 - 근무 요청/근무 입력 버튼 */}
        <div className="col-start-3 flex justify-end gap-2">
          {!hasWard ? (
            <Button
              color="primary"
              text-size="md"
              className={`whitespace-nowrap ${
                isMobile ? 'px-2 py-2 text-xs' : 'py-0.5 px-1.5 sm:py-1 sm:px-2'
              } ${
                isWorkInputMode
                  ? 'bg-[#f47056] text-white border-[0.5px] border-[#f47056]'
                  : 'bg-[#fff4ee] text-[#f47056] border-[0.5px] border-[#f47056] hover:bg-[#ffebe1]'
              }`}
              onClick={handleWorkInputButtonClick}
              size={isMobile ? 'xs' : 'register'}
            >
              <div className="flex items-center gap-1 relative group">
                <span>근무 입력</span>
              </div>
            </Button>
          ) : (
            <Button
              color="primary"
              text-size="md"
              className={`whitespace-nowrap ${
                isMobile ? 'px-2 py-2 text-xs' : 'py-0.5 px-1.5 sm:py-1 sm:px-2'
              }`}
              onClick={() => {
                setIsReqModalOpen(true);
              }}
              size={isMobile ? 'xs' : 'register'}
            >
              <div className="flex items-center gap-1 relative group">
                <span>근무 요청</span>
              </div>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className={`bg-white ${isMobile ? '' : 'rounded-[1rem]'} w-full`}>
          {/* 달력 헤더 */}
          <div className="grid grid-cols-7 mb-0">
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
          <div
            ref={calendarGridRef}
            className="calendar-grid grid grid-cols-7 divide-x divide-y divide-gray-100 border border-gray-100 auto-rows-[6.5rem] overflow-hidden"
          >
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
                <DutyBadgeKor
                  type={duty}
                  size="xs"
                  bgColor={defaultDutyColors[duty].bg}
                  textColor={defaultDutyColors[duty].text}
                />
              ) : null;

              // 요일 및 공휴일 확인
              const dayOfWeek = getDayOfWeek(prevYear, prevMonth, day);
              const isHolidayDate = isHoliday(prevYear, prevMonth, day);

              // 텍스트 색상 결정
              let textColor = 'text-base-muted';
              if (isHolidayDate || dayOfWeek === 0) textColor = 'text-red-500';
              else if (dayOfWeek === 6) textColor = 'text-blue-500';

              return (
                <div
                  key={`prev-${day}`}
                  className={`${
                    isMobile ? 'min-h-[5rem] p-[2px]' : 'p-2 lg:p-3'
                  } relative bg-gray-50 cursor-not-allowed flex flex-col justify-between`}
                >
                  <span className={`${textColor} text-xs lg:text-sm`}>
                    {day}
                  </span>
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right pointer-events-none">
                      {dutyBadge}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 현재 달 날짜 */}
            {currentMonthDays.map((day, idx) => {
              const isTodayDate = isToday(currentYear, currentMonth, day);
              const holidayName = getHolidayText(day);
              const duty = getDutyFromShifts(
                new Date(currentYear, currentMonth - 1, day),
                day
              );
              const dutyBadge = duty ? (
                <DutyBadgeKor
                  type={duty}
                  size="xs"
                  bgColor={defaultDutyColors[duty].bg}
                  textColor={defaultDutyColors[duty].text}
                />
              ) : null;
              const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const schedules = sortSchedules(schedulesByDate[dateKey] || []);

              return (
                <div
                  ref={(el) => (cellRefs.current[idx] = el)}
                  key={`current-${day}`}
                  data-date={dateKey}
                  onClick={(e) =>
                    handleDateClick(
                      new Date(currentYear, currentMonth - 1, day),
                      e,
                      idx
                    )
                  }
                  className={`${
                    isMobile ? 'min-h-[6.5rem] p-1' : 'p-2 lg:p-3'
                  } relative cursor-pointer hover:bg-gray-50 flex flex-col ${
                    externalSelectedDate &&
                    externalSelectedDate.getDate() === day &&
                    externalSelectedDate.getMonth() === currentMonth - 1
                      ? 'ring-2 ring-primary ring-inset'
                      : ''
                  }
                  ${
                    workInputSelectedDate &&
                    workInputSelectedDate.getDate() === day &&
                    workInputSelectedDate.getMonth() === currentMonth - 1 &&
                    workInputSelectedDate.getFullYear() === currentYear &&
                    isWorkInputMode
                      ? 'ring-2 ring-primary ring-inset'
                      : ''
                  }
                  `}
                >
                  {/* 날짜 표시 영역 */}
                  <div
                    className={`relative ${isMobile ? 'flex flex-row items-center justify-start mb-1' : 'flex flex-row items-center justify-between mb-1'}`}
                  >
                    <span
                      className={`${isMobile ? 'w-[1.1rem] h-[1.1rem]' : 'w-5 h-5'} flex items-center justify-center ${
                        isTodayDate ? 'bg-primary rounded-full' : ''
                      } ${getDateStyle(day, isTodayDate)} text-xs lg:text-sm`}
                    >
                      {day}
                    </span>
                    {holidayName && (
                      <span
                        className={`text-red-500 truncate max-w-[80%] line-clamp-1 ${isMobile ? 'ml-[2px] text-[0.4rem]' : 'ml-1 text-[10px] lg:text-[11px]'}`}
                      >
                        {holidayName}
                      </span>
                    )}
                  </div>

                  {/* 일정 메모 리스트 (TodayShiftModal 캘린더 탭 스타일) */}
                  <div
                    className={`${isMobile ? 'h-[3.3rem] mb-0.5' : 'flex-1 mt-1'} overflow-hidden`}
                  >
                    <div className="flex flex-col gap-0">
                      {schedules.slice(0, 3).map((schedule, idx) => (
                        <div
                          key={schedule.calendarId || `temp-${idx}`}
                          className={`flex items-center gap-[1px] ${isMobile ? 'h-[0.9rem] py-0' : 'min-h-0 py-0'} min-w-0`}
                          title={schedule.title}
                        >
                          <span
                            className={`inline-block rounded-full flex-shrink-0 ${
                              colorClassMap[schedule.color] || 'bg-gray-300'
                            } ${isMobile ? 'w-[0.3em] h-[0.2rem]' : 'w-[0.5rem] h-[0.4rem]'}`}
                          />
                          <span
                            className={`whitespace-nowrap overflow-hidden text-gray-700 leading-tight truncate min-w-0 w-full ${isMobile ? 'text-[0.38rem]' : 'text-[8.5px]'}`}
                          >
                            {schedule.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 추가 메모 표시 - 데스크톱은 메모 목록 하단에 배치 */}
                  {schedules.length > 3 && !isMobile && (
                    <div className="flex justify-start mt-1">
                      <span className="bg-gray-100 text-gray-600 rounded px-0.5 py-0.5 inline-block mr-10 whitespace-nowrap text-[6.5px] transform scale-85 origin-left">
                        +{schedules.length - 3}개의 메모
                      </span>
                    </div>
                  )}

                  {/* 듀티 뱃지 표시 */}
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right pointer-events-none">
                      {dutyBadge}
                    </div>
                  )}

                  {/* 모바일에서는 메모 갯수를 마지막 메모와 듀티 뱃지 사이에 배치 */}
                  {schedules.length > 3 && isMobile && (
                    <div className="absolute left-1 bottom-[1.2rem]">
                      <span className="bg-gray-100 text-gray-600 rounded px-0.5 py-[0.1rem] inline-block whitespace-nowrap text-[0.4rem] transform scale-90 origin-left">
                        +{schedules.length - 3}개의 메모
                      </span>
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
                <DutyBadgeKor
                  type={duty}
                  size="xs"
                  bgColor={defaultDutyColors[duty].bg}
                  textColor={defaultDutyColors[duty].text}
                />
              ) : null;

              // 요일 및 공휴일 확인
              const dayOfWeek = getDayOfWeek(nextYear, nextMonth, day);
              const isHolidayDate = isHoliday(nextYear, nextMonth, day);

              // 텍스트 색상 결정
              let textColor = 'text-base-muted';
              if (isHolidayDate || dayOfWeek === 0) textColor = 'text-red-500';
              else if (dayOfWeek === 6) textColor = 'text-blue-500';

              return (
                <div
                  key={`next-${day}`}
                  className={`${
                    isMobile ? 'min-h-[5rem] p-[2px]' : 'p-2 lg:p-3'
                  } relative bg-gray-50 cursor-not-allowed flex flex-col justify-between`}
                >
                  <span className={`${textColor} text-xs lg:text-sm`}>
                    {day}
                  </span>
                  {dutyBadge && (
                    <div className="absolute bottom-1 right-1 lg:bottom-0.5 lg:right-0.5 transform scale-[0.45] lg:scale-75 origin-bottom-right pointer-events-none">
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

      {isWorkModalOpen && (
        <WorkCRUDModal
          open={isWorkModalOpen}
          onClose={() => {
            setIsWorkModalOpen(false);
            setIsWorkInputMode(false);
            setWorkInputSelectedDate(null);
          }}
          selectedDate={workInputSelectedDate}
          setSelectedDate={setWorkInputSelectedDate}
          onDutyUpdated={
            typeof refreshMyDutyData === 'function'
              ? refreshMyDutyData
              : undefined
          }
          currentShift={(() => {
            if (!workInputSelectedDate || !dutyData) return undefined;
            const dayIdx = workInputSelectedDate.getDate() - 1;
            return dutyData.shifts[dayIdx] as
              | 'D'
              | 'E'
              | 'N'
              | 'O'
              | 'M'
              | 'X'
              | undefined;
          })()}
          dutyData={dutyData}
          setMyDutyData={setMyDutyData}
        />
      )}

      {/* 모바일 TodayShiftModal은 근무 입력 모드가 아닐 때만 표시 */}
      {isMobile &&
        isTodayShiftModalOpen &&
        dutyData &&
        externalSelectedDate &&
        !isWorkInputMode && (
          <TodayShiftModal
            date={externalSelectedDate}
            duty={
              getDutyFromShifts(
                externalSelectedDate,
                externalSelectedDate.getDate()
              ) || 'off'
            }
            dutyData={{
              myShift:
                (dutyData.shifts[externalSelectedDate.getDate() - 1] as
                  | 'D'
                  | 'E'
                  | 'N'
                  | 'O'
                  | 'X'
                  | 'M') || 'X',
              otherShifts: [], // 필요시 실제 데이터로 교체
            }}
            isMobile={isMobile}
            onClose={() => setIsTodayShiftModalOpen(false)}
            onDateChange={() => {}}
            schedulesByDate={schedulesByDate}
            setSchedulesByDate={() => {}}
            activeTab={'calendar'}
            onTabChange={() => {}}
            selectedDutyType={'day'}
            onDutyTypeChange={handleDutyTypeChange}
          />
        )}
    </div>
  );
};

export default MyShiftCalendar;
