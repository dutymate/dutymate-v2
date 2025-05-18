import { useEffect, useState } from 'react';
import { IoMdMenu } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import KakaoPlaceModal from '@/components/organisms/KakaoPlaceModal';
import MSidebar from '@/components/organisms/MSidebar';
import MyShiftCalendar from '@/components/organisms/MyShiftCalendar';
import TodayShiftModal from '@/components/organisms/TodayShiftModal';
import WorkCRUDModal from '@/components/organisms/WorkCRUDModal';
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import type { ScheduleType } from '@/services/calendarService';
import { dutyService, MyDuty } from '@/services/dutyService';
import { useLoadingStore } from '@/stores/loadingStore';
import useUserAuthStore from '@/stores/userAuthStore';
import { convertDutyTypeSafe, getDutyColors } from '@/utils/dutyUtils';
import { CalendarEvent } from '@/types/calendar';

// 일정 색상 클래스 매핑 - 사용자 색상 대신 일정 색상용으로만 유지
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

const MyShift = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuty, setSelectedDuty] = useState<
    'day' | 'evening' | 'night' | 'off' | 'mid'
  >('day');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myDutyData, setMyDutyData] = useState<MyDuty | null>(null);
  const [dayDutyData, setDayDutyData] = useState<{
    myShift: 'D' | 'E' | 'N' | 'O' | 'M';
    otherShifts: {
      grade: number;
      name: string;
      shift: 'D' | 'E' | 'N' | 'O' | 'M';
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useUserAuthStore();
  const navigate = useNavigate();

  // 날짜별 일정(메모) 상태
  const [schedulesByDate, setSchedulesByDate] = useState<
    Record<string, ScheduleType[]>
  >({});

  // 카카오맵 모달 상태
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  // 추가된 activeTab state
  const [activeTab, setActiveTab] = useState<'status' | 'calendar'>('calendar');

  // 추가된 selectedDutyType state
  const [selectedDutyType, setSelectedDutyType] = useState<
    'day' | 'off' | 'evening' | 'night' | 'mid'
  >('day');

  // 근무 입력 모드 상태
  const [isWorkInputMode, setIsWorkInputMode] = useState(false);

  // 근무 입력용 선택 날짜
  const [workInputSelectedDate, setWorkInputSelectedDate] =
    useState<Date | null>(null);

  // 사용자 색상 정보를 이용한 duty 색상 설정 - 유틸리티 함수 사용
  const dutyColors = getDutyColors(userInfo?.color);

  // 사용자 색상 설정이 변경될 때마다 dutyColors 업데이트
  useEffect(() => {
    // userInfo?.color가 변경될 때마다 실행됨
    // dutyColors는 getDutyColors(userInfo?.color)로 이미 자동 업데이트됨
  }, [userInfo?.color]);

  // CalendarEvent를 ScheduleType으로 변환하는 함수
  const convertCalendarEventToSchedule = (
    event: CalendarEvent
  ): ScheduleType => {
    return {
      calendarId: event.calendarId,
      title: event.title,
      color: event.color,
      date: event.date,
      place: '',
      isAllDay: true,
    };
  };

  // 초기 데이터 로딩
  useEffect(() => {
    useLoadingStore.getState().setLoading(true);
    const fetchMyDuty = async () => {
      try {
        const today = new Date();
        const data = await dutyService.getMyDuty(
          today.getFullYear(),
          today.getMonth() + 1
        );
        // console.log('data', data);
        setMyDutyData(data);

        // MyDuty 응답에서 받은 calendar 데이터를 schedulesByDate로 변환
        if (data.calendar) {
          const allCalendarEvents = [
            ...(data.calendar.prevCalendar || []),
            ...(data.calendar.currCalendar || []),
            ...(data.calendar.nextCalendar || []),
          ];

          const newSchedulesByDate: Record<string, ScheduleType[]> = {};

          allCalendarEvents.forEach((event) => {
            const dateKey = event.date;
            if (!newSchedulesByDate[dateKey]) {
              newSchedulesByDate[dateKey] = [];
            }

            newSchedulesByDate[dateKey].push(
              convertCalendarEventToSchedule(event)
            );
          });

          setSchedulesByDate(newSchedulesByDate);
        }

        useLoadingStore.getState().setLoading(false);
      } catch (error) {
        useLoadingStore.getState().setLoading(false);
        navigate('/error');
      }
    };
    fetchMyDuty();
  }, [navigate]);

  // myDutyData가 바뀔 때마다(즉, 월이 바뀔 때마다) 일정 데이터 업데이트
  useEffect(() => {
    if (!myDutyData || !myDutyData.calendar) return;

    const allCalendarEvents = [
      ...(myDutyData.calendar.prevCalendar || []),
      ...(myDutyData.calendar.currCalendar || []),
      ...(myDutyData.calendar.nextCalendar || []),
    ];

    const newSchedulesByDate: Record<string, ScheduleType[]> = {};

    allCalendarEvents.forEach((event) => {
      const dateKey = event.date;
      if (!newSchedulesByDate[dateKey]) {
        newSchedulesByDate[dateKey] = [];
      }

      newSchedulesByDate[dateKey].push(convertCalendarEventToSchedule(event));
    });

    setSchedulesByDate(newSchedulesByDate);
  }, [myDutyData]);

  // 날짜 선택 시 해당 날짜의 근무 데이터 로딩
  const handleDateSelect = async (date: Date | null) => {
    if (!date) return;

    // 근무 입력 모드인 경우 WorkCRUDModal을 위한 날짜 설정만 하고 TodayShiftModal은 열지 않음
    if (isWorkInputMode) {
      setWorkInputSelectedDate(date);
      setIsWorkCRUDModalOpen(true);
      return;
    }

    // 일반 모드에서는 기존 로직 유지
    setSelectedDate(date);
    setActiveTab('calendar'); // 날짜 클릭 시 캘린더 탭으로 전환

    try {
      setLoading(true);
      const data = await dutyService.getMyDayDuty(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      setDayDutyData(data);

      const dutyType = convertDutyTypeSafe(data.myShift);
      setSelectedDuty(dutyType);
      setSelectedDutyType(dutyType);
    } catch (error) {
      toast.error('해당 날짜의 근무 정보가 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // MyShiftCalendar에서 월 변경 시 호출할 핸들러 추가
  const handleMonthChange = async (year: number, month: number) => {
    try {
      const data = await dutyService.getMyDuty(year, month);
      setMyDutyData(data);
    } catch (error) {}
  };

  // 전체 월간 근무 데이터를 갱신하는 함수 추가
  const refreshMyDutyData = async () => {
    if (!workInputSelectedDate && !selectedDate) return;

    const dateToUse = workInputSelectedDate || selectedDate;
    if (!dateToUse) return;

    try {
      const year = dateToUse.getFullYear();
      const month = dateToUse.getMonth() + 1;

      // 월간 근무 데이터 새로 가져오기
      const updatedMonthData = await dutyService.getMyDuty(year, month);
      setMyDutyData(updatedMonthData);

      // MyDuty 응답에서 받은 calendar 데이터를 schedulesByDate로 변환
      if (updatedMonthData.calendar) {
        const allCalendarEvents = [
          ...(updatedMonthData.calendar.prevCalendar || []),
          ...(updatedMonthData.calendar.currCalendar || []),
          ...(updatedMonthData.calendar.nextCalendar || []),
        ];

        const newSchedulesByDate: Record<string, ScheduleType[]> = {};

        allCalendarEvents.forEach((event) => {
          const dateKey = event.date;
          if (!newSchedulesByDate[dateKey]) {
            newSchedulesByDate[dateKey] = [];
          }
          newSchedulesByDate[dateKey].push(
            convertCalendarEventToSchedule(event)
          );
        });

        setSchedulesByDate(newSchedulesByDate);
      }
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  // 근무 입력 버튼 클릭 핸들러
  const handleWorkInputClick = () => {
    setIsWorkInputMode(true);
    toast.info('날짜를 선택하세요');
  };

  const isDemo = userInfo?.isDemo;
  const [isWorkCRUDModalOpen, setIsWorkCRUDModalOpen] = useState(false);

  return (
    <>
      <SEO
        title="나의 근무표 | Dutymate"
        description="나의 근무 일정을 확인해보세요."
      />

      <div className="w-full h-screen flex flex-row bg-[#F4F4F4]">
        {/* 데스크톱 Sidebar */}
        <div className="hidden lg:block w-[14.875rem] shrink-0">
          <Sidebar
            userType={userInfo?.role as 'HN' | 'RN'}
            isDemo={isDemo ?? false}
          />
        </div>

        {/* 모바일 Sidebar */}
        <MSidebar
          userType={userInfo?.role as 'HN' | 'RN'}
          isOpen={isSidebarOpen}
          isDemo={isDemo ?? false}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 min-w-0 px-0 py-0 lg:px-8 lg:py-6 h-screen overflow-y-auto">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-3 lg:hidden mb-4 px-4 pt-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <IoMdMenu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">나의 듀티표</h1>
              <p className="text-sm text-gray-500">
                나의 듀티표를 확인해보세요
              </p>
            </div>
            {isDemo && <DemoTimer />}
          </div>

          {/* 데스크톱 타이틀 */}
          <div className="hidden lg:flex items-center mb-6 w-full">
            <Title title="나의 듀티표" subtitle="나의 듀티표를 확인해보세요" />
            <div className="flex-1 h-[1.5px] bg-gray-200 ml-4" />
          </div>
          <div className="block lg:flex lg:gap-[2rem]">
            {/* 캘린더와 모달을 감싸는 컨테이너 */}
            <div className="calendar-modal-container flex flex-col lg:flex-row w-full gap-y-0 lg:gap-x-4">
              {/* 캘린더 영역 - 모달 영역과 함께 고정 비율 유지 */}
              <div className="relative flex flex-col lg:flex-1 lg:min-w-0">
                <MyShiftCalendar
                  onDateSelect={handleDateSelect}
                  selectedDate={
                    isWorkInputMode ? workInputSelectedDate : selectedDate
                  }
                  dutyData={myDutyData}
                  onMonthChange={handleMonthChange}
                  schedulesByDate={schedulesByDate}
                  colorClassMap={colorClassMap}
                  dutyColors={dutyColors}
                  setMyDutyData={setMyDutyData}
                  refreshMyDutyData={refreshMyDutyData}
                  onWorkCRUDModalOpen={() => setIsWorkCRUDModalOpen(true)}
                  isWorkInputMode={isWorkInputMode}
                  onWorkInputClick={handleWorkInputClick}
                />
              </div>

              {/* ✅ 모달 영역: 항상 자리 차지하되 조건부 렌더링 */}
              <div className="hidden lg:block lg:w-[24.5rem] lg:flex-shrink-0">
                {selectedDate && dayDutyData ? (
                  <TodayShiftModal
                    date={selectedDate}
                    duty={selectedDuty}
                    dutyData={dayDutyData}
                    isMobile={false}
                    onClose={() => setSelectedDate(null)}
                    onDateChange={(newDate) => handleDateSelect(newDate)}
                    schedulesByDate={schedulesByDate}
                    setSchedulesByDate={setSchedulesByDate}
                    loading={loading}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedDutyType={selectedDutyType}
                    onDutyTypeChange={setSelectedDutyType}
                    refreshMyDutyData={refreshMyDutyData}
                    dutyColors={dutyColors}
                  />
                ) : (
                  <div className="w-full min-h-[40.5rem] bg-white rounded-[1rem] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-gray-400 text-base">
                      날짜를 클릭하면 상세 근무표가 표시됩니다.
                    </span>
                  </div>
                )}
              </div>

              {/* ✅ 모바일 모달 */}
              <div className="lg:hidden">
                {selectedDate && dayDutyData ? (
                  <TodayShiftModal
                    date={selectedDate}
                    duty={selectedDuty}
                    dutyData={dayDutyData}
                    isMobile={true}
                    onClose={() => setSelectedDate(null)}
                    onDateChange={(newDate) => handleDateSelect(newDate)}
                    schedulesByDate={schedulesByDate}
                    setSchedulesByDate={setSchedulesByDate}
                    loading={loading}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedDutyType={selectedDutyType}
                    onDutyTypeChange={setSelectedDutyType}
                    refreshMyDutyData={refreshMyDutyData}
                    dutyColors={dutyColors}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WorkCRUDModal */}
      <WorkCRUDModal
        open={isWorkCRUDModalOpen}
        onClose={() => {
          setIsWorkCRUDModalOpen(false);
          setIsWorkInputMode(false);
          setWorkInputSelectedDate(null);
        }}
        selectedDate={workInputSelectedDate}
        setSelectedDate={setWorkInputSelectedDate}
        onDutyUpdated={refreshMyDutyData}
        currentShift={
          workInputSelectedDate && myDutyData
            ? (myDutyData.shifts[workInputSelectedDate.getDate() - 1] as
                | 'D'
                | 'E'
                | 'N'
                | 'O'
                | 'M'
                | 'X')
            : undefined
        }
        dutyData={myDutyData}
        setMyDutyData={setMyDutyData}
      />

      <KakaoPlaceModal
        open={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSelect={() => {}}
      />

      <div
        className="block lg:hidden w-full"
        style={{ height: '14rem', background: '#F4F4F4' }}
      />
    </>
  );
};

export default MyShift;
