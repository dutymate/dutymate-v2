import { useEffect, useState } from 'react';
import { IoMdMenu } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import MSidebar from '@/components/organisms/MSidebar';
import MyShiftCalendar from '@/components/organisms/MyShiftCalendar';
import Sidebar from '@/components/organisms/WSidebar';
import TodayShiftModal from '@/components/organisms/TodayShiftModal';
import { SEO } from '@/components/SEO';
import { dutyService } from '@/services/dutyService';
import { useLoadingStore } from '@/stores/loadingStore';
import useUserAuthStore from '@/stores/userAuthStore';
import KakaoPlaceModal from '@/components/organisms/KakaoPlaceModal';
import type { ScheduleType } from '@/services/calendarService';
import { fetchSchedules as fetchSchedulesFromService } from '@/services/calendarService';

// Duty 타입 변환 유틸리티 함수
const convertDutyType = (
  duty: 'D' | 'E' | 'N' | 'O' | 'M'
): 'day' | 'evening' | 'night' | 'off' | 'mid' => {
  const dutyMap = {
    D: 'day',
    E: 'evening',
    N: 'night',
    O: 'off',
    M: 'mid',
  } as const;
  return dutyMap[duty];
};

// 일정 색상 클래스 매핑
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

// 일정 타입 정의 부분 삭제
// type ScheduleType = { ... } 삭제

const MyShift = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuty, setSelectedDuty] = useState<
    'day' | 'evening' | 'night' | 'off' | 'mid'
  >('day');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myDutyData, setMyDutyData] = useState<{
    year: number;
    month: number;
    shifts: string;
    prevShifts: string;
    nextShifts: string;
  } | null>(null);
  const [dayDutyData, setDayDutyData] = useState<{
    myShift: 'D' | 'E' | 'N' | 'O' | 'M';
    otherShifts: {
      grade: number;
      name: string;
      shift: 'D' | 'E' | 'N' | 'O' | 'M';
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useUserAuthStore(); // 전역 상태에서 role 가져오기
  const navigate = useNavigate();

  // 날짜별 일정(메모) 상태
  const [schedulesByDate, setSchedulesByDate] = useState<
    Record<string, ScheduleType[]>
  >({});

  // 카카오맵 모달 상태
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  // 추가된 activeTab state
  const [activeTab, setActiveTab] = useState<'status' | 'calendar'>('status');

  // 추가된 selectedDutyType state
  const [selectedDutyType, setSelectedDutyType] = useState<
    'day' | 'off' | 'evening' | 'night' | 'mid'
  >('day');

  // 캘린더 데이터 가져오기 함수 수정
  const fetchSchedules = async (date: Date) => {
    try {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const schedules = await fetchSchedulesFromService(date);
      setSchedulesByDate((prev) => ({
        ...prev,
        [dateKey]: schedules,
      }));
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      setSchedulesByDate((prev) => ({
        ...prev,
        [dateKey]: [],
      }));
    }
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
        setMyDutyData(data);
        useLoadingStore.getState().setLoading(false);
      } catch (error) {
        useLoadingStore.getState().setLoading(false);
        console.error('Failed to fetch duty data:', error);
        navigate('/error');
      }
    };
    fetchMyDuty();
  }, [navigate]);

  // myDutyData가 바뀔 때마다(즉, 월이 바뀔 때마다) 모든 날짜의 메모를 미리 불러오기
  useEffect(() => {
    if (!myDutyData) return;
    const { year, month } = myDutyData;
    const daysInMonth = new Date(year, month, 0).getDate();

    // 모든 날짜의 fetch를 병렬로 실행 후, 한 번에 상태 업데이트
    const fetchAllSchedules = async () => {
      const results = await Promise.all(
        Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month - 1, day);
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return fetchSchedulesFromService(date).then((schedules) => ({
            dateKey,
            schedules,
          }));
        })
      );
      // 한 번에 상태 업데이트
      setSchedulesByDate((prev) => {
        const newState = { ...prev };
        results.forEach(({ dateKey, schedules }) => {
          newState[dateKey] = schedules;
        });
        return newState;
      });
    };
    fetchAllSchedules();
  }, [myDutyData]);

  // 날짜 선택 시 해당 날짜의 근무 데이터 로딩
  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    setDayDutyData(null); // 새로운 요청 시 이전 데이터 초기화
    try {
      const data = await dutyService.getMyDayDuty(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      setDayDutyData(data);
      setSelectedDuty(convertDutyType(data.myShift));
      setSelectedDutyType(convertDutyType(data.myShift));

      // 일정 데이터도 함께 가져오기
      await fetchSchedules(date);
    } catch (error) {
      toast.error('해당 날짜의 근무 정보가 없습니다.');
      setSelectedDate(null); // 선택된 날짜 초기화
    } finally {
      setLoading(false);
    }
  };

  // MyShiftCalendar에서 월 변경 시 호출할 핸들러 추가
  const handleMonthChange = async (year: number, month: number) => {
    try {
      const data = await dutyService.getMyDuty(year, month);
      setMyDutyData(data);
    } catch (error) {
      console.error('Failed to fetch duty data:', error);
    }
  };

  // 월 전체 일정(메모) 한 번에 불러오는 함수 추가
  const fetchAllSchedulesForMonth = async (year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const results = await Promise.all(
        Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month - 1, day);
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return fetchSchedulesFromService(date).then((schedules) => ({
            dateKey,
            schedules,
          }));
        })
      );

      // 한 번에 상태 업데이트
      setSchedulesByDate((prev) => {
        const newState = { ...prev };
        results.forEach(({ dateKey, schedules }) => {
          newState[dateKey] = schedules;
        });
        return newState;
      });
    } catch (error) {
      console.error('Failed to fetch all schedules for month:', error);
      toast.error('일정을 불러오는데 실패했습니다.');
    }
  };

  const isDemo = userInfo?.isDemo;

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
        <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 h-screen lg:h-screen overflow-y-auto">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-3 lg:hidden mb-4">
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
          <div className="hidden lg:block">
            <Title title="나의 듀티표" subtitle="나의 듀티표를 확인해보세요" />
          </div>
          <div className="block lg:flex lg:gap-[2rem] mt-6">
            {/* 캘린더와 모달을 감싸는 컨테이너 */}
            <div className="calendar-modal-container flex flex-col lg:flex-row w-full gap-4">
              {/* 캘린더 영역 - 모달이 없으면 100%, 있으면 65% */}
              <div
                className={`relative ${selectedDate && dayDutyData ? 'lg:w-[65%]' : 'lg:w-full'}`}
              >
                <MyShiftCalendar
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  dutyData={myDutyData}
                  onMonthChange={handleMonthChange}
                  schedulesByDate={schedulesByDate}
                  colorClassMap={colorClassMap}
                  setSchedulesByDate={setSchedulesByDate}
                />
              </div>

              {/* 모달 영역 - 35% */}
              {selectedDate && dayDutyData && (
                <>
                  {/* 데스크톱 버전 */}
                  <div className="hidden lg:block lg:w-[35%]">
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
                      fetchAllSchedulesForMonth={fetchAllSchedulesForMonth}
                    />
                  </div>
                  {/* 모바일 버전 */}
                  <div className="lg:hidden">
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
                      fetchAllSchedulesForMonth={fetchAllSchedulesForMonth}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KakaoPlaceModal */}
      <KakaoPlaceModal
        open={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSelect={() => {}}
      />
    </>
  );
};

export default MyShift;
