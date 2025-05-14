import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import ScheduleEditModal from '@/components/organisms/ScheduleEditModal';
import {
  convertDutyTypeSafe,
  getDutyColorForCode,
  getDutyColors,
} from '@/utils/dutyUtils';
import { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import type { ScheduleType } from '@/services/calendarService';
import {
  CalendarCreateRequest,
  createCalendar,
  getCalendarById,
  updateCalendar,
  fetchSchedules,
  deleteCalendar,
} from '@/services/calendarService';
import { toast } from 'react-toastify';
import { wardService } from '@/services/wardService';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { dutyService } from '@/services/dutyService';
import JoinWardGuideModal from './JoinWardGuideModal';
import ShiftColorPickerModal from './ShiftColorPickerModal';
import PageLoadingSpinner from '../atoms/Loadingspinner';
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
  fetchAllSchedulesForMonth?: (year: number, month: number) => Promise<void>;
  refreshMyDutyData?: () => Promise<void>;
  dutyColors?: Record<
    'day' | 'evening' | 'night' | 'off' | 'mid',
    { bg: string; text: string }
  >;
}

const colorClassMap: Record<string, string> = {
  FF43F3: 'bg-pink-400',
  '777777': 'bg-gray-400',
  '3B82F6': 'bg-blue-500',
  '8B5CF6': 'bg-purple-500',
  '22C55E': 'bg-green-500',
  EF4444: 'bg-red-500',
  FACC15: 'bg-yellow-400',
  FB923C: 'bg-orange-400',
};

const TodayShiftModal = ({
  date,
  duty,
  dutyData,
  isMobile,
  onClose,
  onDateChange,
  setSchedulesByDate,
  activeTab,
  onTabChange,
  selectedDutyType,
  onDutyTypeChange,
  fetchAllSchedulesForMonth,
  refreshMyDutyData,
  dutyColors: externalDutyColors,
}: TodayShiftModalProps) => {
  if (!date) return null;

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<
    'create' | 'view' | 'edit'
  >('create');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(
    null
  );
  const [isEnteringWard, setIsEnteringWard] = useState(false);
  const { userInfo, setUserInfo } = useUserAuthStore();

  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
  type DutyType = (typeof dutyTypes)[number];

  // Get user color settings from store or use default colors
  const [localDutyColors, setLocalDutyColors] = useState<
    Record<DutyType, { bg: string; text: string }>
  >(() => {
    // 외부에서 전달받은 dutyColors가 있으면 그것을 사용
    if (externalDutyColors) {
      return externalDutyColors;
    }

    // 유틸리티 함수 사용
    return getDutyColors(userInfo?.color);
  });

  // 외부 dutyColors가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    if (externalDutyColors) {
      setLocalDutyColors(externalDutyColors);
    }
  }, [externalDutyColors]);

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

  const handleScheduleClick = async (calendarId: number) => {
    try {
      const response = await getCalendarById(calendarId);
      const detail = response.data;
      setSelectedSchedule(detail);
      setScheduleModalMode('view');
      setIsScheduleModalOpen(true);
    } catch (error) {}
  };

  const handleDelete = async (calendarId: number) => {
    try {
      // API를 통해 일정 삭제
      await deleteCalendar(calendarId);

      // 선택된 일정 초기화 및 모달 닫기
      setSelectedSchedule(null);
      setIsScheduleModalOpen(false);

      // 해당 날짜의 일정 다시 가져오기
      await loadSchedules();

      // 월 전체 데이터 갱신 (선택적)
      if (refreshMyDutyData) {
        await refreshMyDutyData();
      }
    } catch (error) {
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const handleSave = async (data: Omit<ScheduleType, 'calendarId'>) => {
    try {
      // 선택된 날짜가 JavaScript Date 객체이므로 제대로 형식화
      const selectedDate = new Date(date as Date);

      // 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 이슈 없이)
      const formattedDate = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const req: CalendarCreateRequest = {
        title: data.title || '',
        date: formattedDate, // 명시적으로 형식화된 날짜 사용
        place: data.place || '',
        color: data.color || '',
        isAllDay: !!data.isAllDay,
        ...(data.isAllDay
          ? {}
          : {
              startTime: data.startTime ?? '',
              endTime: data.endTime ?? '',
            }),
      };

      // 모달 먼저 닫기 (사용자 경험 향상)
      setIsScheduleModalOpen(false);

      // API 호출
      await createCalendar(req);

      // 해당 날짜의 일정 다시 가져오기
      await loadSchedules();

      // 월 전체 데이터 갱신 (선택적)
      if (refreshMyDutyData) {
        await refreshMyDutyData();
      }
    } catch (error) {
      alert('일정 저장에 실패했습니다.');
    }
  };

  const handleEdit = async (data: any) => {
    // 모드 전환 처리 - 수정 버튼 클릭 시
    if (data.mode === 'edit') {
      // 모드만 변경하고 반환
      setScheduleModalMode('edit');
      return;
    }

    // 실제 수정 처리 - 저장 버튼 클릭 시
    if (!selectedSchedule?.calendarId) return;

    try {
      // 선택된 날짜가 JavaScript Date 객체이므로 제대로 형식화
      // 이때 날짜가 하루 이전으로 변경되는 문제 해결 (시간대 이슈)
      const selectedDate = new Date(date as Date);

      // 날짜를 YYYY-MM-DD 형식으로 변환
      // getDate()는 해당 날짜의 일(day)을 반환 (시간대 조정 없이)
      const formattedDate = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      // API 호출을 통한 서버 데이터 업데이트
      const editData: CalendarCreateRequest = {
        title: data.title || '',
        date: formattedDate, // 명시적으로 형식화된 날짜 사용
        place: data.place || '',
        color: data.color || '',
        isAllDay: !!data.isAllDay,
        ...(data.isAllDay
          ? {}
          : {
              startTime: data.startTime ?? '',
              endTime: data.endTime ?? '',
            }),
      };

      // 모달 먼저 닫기 (사용자 경험 향상)
      setIsScheduleModalOpen(false);
      setSelectedSchedule(null);

      // API 호출
      await updateCalendar(selectedSchedule.calendarId, editData);

      // 해당 날짜의 일정 다시 가져오기
      await loadSchedules();

      // 월 전체 데이터 갱신 (선택적)
      if (refreshMyDutyData) {
        await refreshMyDutyData();
      }
    } catch (error) {
      alert('일정 수정에 실패했습니다.');
    }
  };

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
      (a, b) =>
        parseTimeString(a.startTime ?? '') - parseTimeString(b.startTime ?? '')
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
      return `${period} ${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
    }
    return timeStr;
  }

  const handleEnterWard = async (wardCode: string) => {
    try {
      // 1. 병동 코드 확인
      await wardService.checkWardCode(wardCode);

      // 2. 병동 입장 대기 성공 시 사용자 정보 업데이트
      setUserInfo({
        ...userInfo!,
        existMyWard: false,
        sentWardCode: true,
      });

      // 3. 성공 메시지 표시
      toast.success('병동 입장 요청이 완료되었습니다.');
    } catch (error: any) {
      if (error instanceof Error) {
        if (error.message === '서버 연결 실패') {
          toast.error('잠시 후 다시 시도해주세요');
          return;
        }
        if (error.message === 'UNAUTHORIZED') {
          return;
        }
      }
      if (error?.response?.status === 400) {
        toast.error(error.response.data.message);
        return;
      }
    }
  };

  // 듀티 버튼 클릭 처리 함수
  const handleDutyBadgeClick = async (
    type: 'day' | 'evening' | 'night' | 'off' | 'mid'
  ) => {
    if (!date || !userInfo) return;

    // 1. 현재 날짜와 사용자 정보 가져오기
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();

    try {
      // 2. 듀티 타입을 서버 형식으로 변환
      const dutyTypeToShiftMap: Record<
        string,
        'D' | 'E' | 'N' | 'O' | 'X' | 'M'
      > = {
        day: 'D',
        evening: 'E',
        night: 'N',
        off: 'O',
        mid: 'M',
      };

      // 3. 현재 선택한 날짜의 근무 정보 가져오기
      const dutyData = await dutyService.getMyDuty(year, month);

      // 4. 현재 날짜에 해당하는 근무 정보 찾기
      const dayIndex = day - 1;
      if (dayIndex < 0 || dayIndex >= dutyData.shifts.length) {
        toast.error('날짜 인덱스가 유효하지 않습니다.');
        return;
      }

      // 5. 현재 해당 날짜의 근무 유형 확인
      const currentShift = dutyData.shifts.charAt(dayIndex);
      const newShift = dutyTypeToShiftMap[type];

      // 6. 같은 근무 유형을 다시 클릭했을 경우 삭제 (X로 설정)
      let shiftToSend = newShift;
      if (currentShift === newShift) {
        shiftToSend = 'X'; // 같은 유형을 다시 클릭하면 삭제
      }

      // 7. 업데이트 요청 데이터 생성 - EditMemberDutyRequestDto 형식으로 변경
      const updateData = {
        year,
        month,
        day,
        shift: shiftToSend,
      };

      // 8. API 호출로 근무표 업데이트
      await dutyService.updateMyDuty(updateData);

      // 9. 월 전체 일정 새로고침 (선택적)
      if (typeof fetchAllSchedulesForMonth === 'function') {
        await fetchAllSchedulesForMonth(year, month);
      }

      // 10. 전체 월간 근무 데이터 갱신 (부모 컴포넌트에서 전달된 함수가 있다면)
      if (typeof refreshMyDutyData === 'function') {
        await refreshMyDutyData();
      } else {
        // refreshMyDutyData가 없는 경우 현재 날짜 다시 선택해서 부분 갱신
        onDateChange(new Date(date));
      }

      // 11. 다음 날짜로 이동
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      onDateChange(nextDay);
    } catch (error) {
      console.error('근무 업데이트 실패:', error);
      toast.error('근무 업데이트에 실패했습니다.');
    }
  };

  // 선택된 날짜의 일정을 가져오는 함수
  const loadSchedules = async () => {
    if (!date) return;

    setIsLoading(true);
    try {
      // calendarService의 fetchSchedules 함수 사용
      const fetchedSchedules = await fetchSchedules(date);
      setSchedules(fetchedSchedules);
    } catch (error) {
      toast.error('일정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜가 변경될 때마다 일정 다시 가져오기
  useEffect(() => {
    loadSchedules();
  }, [date]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-10">
        <PageLoadingSpinner />
      </div>
    );
  }

  const modalContent = (
    <div
      className={`bg-white rounded-[1rem] p-[1rem] shadow-sm ${
        isMobile
          ? 'w-full max-w-[25rem] h-auto max-h-[90vh] py-5 overflow-auto'
          : 'w-full h-full min-h-[37.5rem]'
      } flex flex-col relative`}
    >
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-[0.75rem] right-[0.75rem] z-20"
        >
          <IoMdClose className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* 탭 UI */}
      <div className="flex w-full mb-3 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
        <button
          className={`flex-1 py-1.5 text-center font-semibold transition-colors ${
            activeTab === 'status'
              ? 'bg-white text-primary border-b-2 border-primary'
              : 'bg-white text-gray-400'
          }`}
          onClick={() => onTabChange('status')}
        >
          전체 근무 현황
        </button>
        <button
          className={`flex-1 py-1.5 text-center font-semibold transition-colors ${
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
              <span
                className={`text-duty-${duty} font-medium`}
                style={{ color: localDutyColors[duty].bg }}
              >
                {duty.toUpperCase()}
              </span>{' '}
              입니다!
            </p>
            <div
              className="h-[3px] w-full"
              style={{ backgroundColor: localDutyColors[duty].bg }}
            />
          </div>
        )}
      </div>
      <div className="border-t border-gray-900 mb-[0.25rem] lg:mb-[0.5rem] shrink-0" />

      {/* 탭별 내용 분기 */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'status' ? (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {!dutyData?.otherShifts ? (
              <JoinWardGuideModal
                isEnteringWard={isEnteringWard}
                setIsEnteringWard={setIsEnteringWard}
                userInfo={userInfo}
                onSubmit={handleEnterWard}
                removeRadius={true}
                removeShadow={true}
              />
            ) : (
              <div className="space-y-[0.0625rem] lg:space-y-[0.125rem]">
                {dutyData.otherShifts
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
                            type={convertDutyTypeSafe(nurse.shift)}
                            size="xxs"
                            bgColor={
                              getDutyColorForCode(nurse.shift, localDutyColors)
                                .bg
                            }
                            textColor={
                              getDutyColorForCode(nurse.shift, localDutyColors)
                                .text
                            }
                          />
                        </div>
                      ) : (
                        <div className="w-[4.0625rem] h-[1.875rem]" />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 근무 종류 뱃지: userInfo.existMyWard가 false일 때만 표시 */}
            {!userInfo?.existMyWard && (
              <div
                className={`w-full ${
                  isMobile ? 'mb-2 p-1 rounded-lg' : 'mb-3 p-3 rounded-xl'
                } bg-white flex ${
                  isMobile
                    ? 'flex-row justify-center gap-1'
                    : 'flex-col items-center justify-center'
                } shrink-0`}
              >
                {isMobile ? (
                  <div className="flex flex-row flex-wrap justify-center gap-1 w-full">
                    {(['day', 'off', 'evening', 'night', 'mid'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            onDutyTypeChange(type);
                            handleDutyBadgeClick(type);
                          }}
                          className={`rounded-lg focus:outline-none transition-all border-1 px-0.5 py-0.5 ${
                            selectedDutyType === type
                              ? 'ring-2'
                              : 'border-transparent'
                          }`}
                          style={{
                            lineHeight: 0,
                            ...(selectedDutyType === type
                              ? ({
                                  '--tw-ring-color': localDutyColors[type].bg,
                                } as React.CSSProperties)
                              : {}),
                          }}
                        >
                          <DutyBadgeKor
                            type={type}
                            size="xxs"
                            bgColor={localDutyColors[type].bg}
                            textColor={localDutyColors[type].text}
                          />
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
                          onClick={() => {
                            onDutyTypeChange(type);
                            handleDutyBadgeClick(type);
                          }}
                          className={`rounded-lg focus:outline-none transition-all border-1 px-0.5 py-0.5 ${
                            selectedDutyType === type
                              ? 'ring-2'
                              : 'border-transparent'
                          }`}
                          style={{
                            lineHeight: 0,
                            ...(selectedDutyType === type
                              ? ({
                                  '--tw-ring-color': localDutyColors[type].bg,
                                } as React.CSSProperties)
                              : {}),
                          }}
                        >
                          <DutyBadgeKor
                            type={type}
                            size="xxs"
                            bgColor={localDutyColors[type].bg}
                            textColor={localDutyColors[type].text}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center gap-2">
                      {(['evening', 'night', 'mid'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            onDutyTypeChange(type);
                            handleDutyBadgeClick(type);
                          }}
                          className={`rounded-lg focus:outline-none transition-all border-1 px-0.5 py-0.5 ${
                            selectedDutyType === type
                              ? 'ring-2'
                              : 'border-transparent'
                          }`}
                          style={{
                            lineHeight: 0,
                            ...(selectedDutyType === type
                              ? ({
                                  '--tw-ring-color': localDutyColors[type].bg,
                                } as React.CSSProperties)
                              : {}),
                          }}
                        >
                          <DutyBadgeKor
                            type={type}
                            size="xxs"
                            bgColor={localDutyColors[type].bg}
                            textColor={localDutyColors[type].text}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {/* 일정 리스트 */}
            <div
              className={`flex flex-col gap-1.5 flex-1 overflow-y-auto mb-2 ${
                isMobile ? 'max-h-[12rem]' : 'max-h-[25rem]'
              }`}
            >
              {sortedSchedules.map((schedule) => (
                <div
                  key={schedule.calendarId || Math.random()}
                  className="flex items-start gap-1.5 cursor-pointer rounded-lg p-0.5 hover:bg-gray-50"
                  onClick={() =>
                    schedule.calendarId &&
                    handleScheduleClick(schedule.calendarId)
                  }
                  style={
                    !schedule.calendarId
                      ? { opacity: 0.5, pointerEvents: 'none' }
                      : {}
                  }
                >
                  {/* 색상 동그라미 */}
                  <span
                    className={`${
                      isMobile ? 'w-2.5 h-2.5 mt-1.5' : 'w-3 h-3 mt-2'
                    } rounded-full flex-shrink-0 ${
                      colorClassMap[schedule.color] || 'bg-gray-300'
                    }`}
                  />
                  {/* 시간 or 종일 */}
                  <div
                    className={`relative min-w-[3rem] ${
                      isMobile ? 'min-w-[2.8rem]' : 'min-w-[3.5rem]'
                    } flex flex-col items-end justify-center flex-shrink-0`}
                    style={{ height: isMobile ? '1.8rem' : '2.25rem' }}
                  >
                    {schedule.isAllDay ? (
                      <span
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-2.5 ${
                          isMobile ? 'text-[10px]' : 'text-xs'
                        } text-primary font-bold`}
                      >
                        종일
                      </span>
                    ) : (
                      <>
                        <span
                          className={`${
                            isMobile ? 'text-[10px]' : 'text-xs'
                          } text-gray-500`}
                        >
                          {formatTimeForDisplay(schedule.startTime ?? '')}
                        </span>
                        <span
                          className={`${
                            isMobile ? 'text-[10px]' : 'text-xs'
                          } text-gray-400`}
                        >
                          {formatTimeForDisplay(schedule.endTime ?? '')}
                        </span>
                      </>
                    )}
                  </div>
                  {/* 제목 */}
                  <div
                    className={`flex-1 bg-gray-50 rounded-lg px-2 py-1 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    } font-medium min-w-0`}
                  >
                    <div className="truncate">{schedule.title}</div>
                    {isMobile && schedule.place && (
                      <div className="text-[10px] text-gray-500 truncate">
                        {schedule.place}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sortedSchedules.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                  등록된 일정이 없습니다
                </div>
              )}
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
          initialData={
            selectedSchedule
              ? {
                  ...selectedSchedule,
                  startTime: selectedSchedule.startTime ?? '',
                  endTime: selectedSchedule.endTime ?? '',
                }
              : undefined
          }
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSave}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentScheduleCount={schedules.length}
          setSchedulesByDate={setSchedulesByDate}
          date={
            date
              ? date.toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10)
          }
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
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
        <ShiftColorPickerModal
          open={isColorModalOpen}
          onClose={() => setIsColorModalOpen(false)}
          dutyColors={localDutyColors}
          onChange={(newColors) => {
            // 완료 버튼을 클릭했을 때만 호출됨
            setLocalDutyColors(newColors);
          }}
        />
      </>
    );
  }

  return (
    <>
      {modalContent}
      <ShiftColorPickerModal
        open={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        dutyColors={localDutyColors}
        onChange={(newColors) => {
          // 완료 버튼을 클릭했을 때만 호출됨
          setLocalDutyColors(newColors);
        }}
      />
    </>
  );
};

export default TodayShiftModal;
