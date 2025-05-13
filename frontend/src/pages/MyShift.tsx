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
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import type { ScheduleType } from '@/services/calendarService';
import { fetchSchedules as fetchSchedulesFromService } from '@/services/calendarService';
import { dutyService } from '@/services/dutyService';
import { useLoadingStore } from '@/stores/loadingStore';
import useUserAuthStore from '@/stores/userAuthStore';
import { convertDutyTypeSafe, getDutyColors } from '@/utils/dutyUtils';

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

  // 사용자 색상 정보를 이용한 duty 색상 설정 - 유틸리티 함수 사용
  const dutyColors = getDutyColors(userInfo?.color);

  // 사용자 색상 설정이 변경될 때마다 dutyColors 업데이트
  useEffect(() => {
    // userInfo?.color가 변경될 때마다 실행됨
    // dutyColors는 getDutyColors(userInfo?.color)로 이미 자동 업데이트됨
  }, [userInfo?.color]);

  // 캘린더 데이터 가져오기 함수 수정
  const fetchSchedules = async (date: Date) => {
    try {
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const schedules = await fetchSchedulesFromService(date);
      setSchedulesByDate((prev) => ({
        ...prev,
        [dateKey]: schedules,
      }));
    } catch (error) {
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
            day
          ).padStart(2, '0')}`;
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
    setLoading(true);
    try {
      const data = await dutyService.getMyDayDuty(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      setSelectedDate(date); // ✅ 데이터를 다 받아온 후 set
      setDayDutyData(data);

      const dutyType = convertDutyTypeSafe(data.myShift);
      setSelectedDuty(dutyType);
      setSelectedDutyType(dutyType);

      await fetchSchedules(date);
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
    if (!selectedDate) return;

    try {
      // 1. 현재 선택된 날짜의 월간 근무 데이터 갱신
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;

      // 월간 근무 데이터 새로 가져오기
      const updatedMonthData = await dutyService.getMyDuty(year, month);
      setMyDutyData(updatedMonthData);

      // 2. 현재 선택된 날짜의 일별 근무 데이터 갱신은 생략
      // 다음 날짜로 이동할 것이므로 현재 날짜의 데이터는 갱신할 필요 없음
      // 성공 메시지
    } catch (error) {}
  };

  // 월 전체 일정(메모) 한 번에 불러오는 함수 추가
  const fetchAllSchedulesForMonth = async (year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const results = await Promise.all(
        Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month - 1, day);
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
            day
          ).padStart(2, '0')}`;
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
              {/* 캘린더 영역 - 모달 영역과 함께 고정 비율 유지 */}
              <div className="relative lg:flex-1">
                <MyShiftCalendar
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  dutyData={myDutyData}
                  onMonthChange={handleMonthChange}
                  schedulesByDate={schedulesByDate}
                  colorClassMap={colorClassMap}
                  setSchedulesByDate={setSchedulesByDate}
                  dutyColors={dutyColors}
                />
              </div>

              {/* ✅ 모달 영역: 항상 자리 차지하되 조건부 렌더링 */}
              <div className="hidden lg:block lg:w-[24.5rem]">
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
                    fetchAllSchedulesForMonth={fetchAllSchedulesForMonth}
                    refreshMyDutyData={refreshMyDutyData}
                    dutyColors={dutyColors}
                  />
                ) : null}
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
                    fetchAllSchedulesForMonth={fetchAllSchedulesForMonth}
                    refreshMyDutyData={refreshMyDutyData}
                    dutyColors={dutyColors}
                  />
                ) : null}
              </div>
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
