import { useEffect, useState } from 'react';
import { IoMdMenu } from 'react-icons/io';

import DemoTimer from '@/components/atoms/DemoTimer';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import HistoryList from '@/components/organisms/HistoryList';
import MSidebar from '@/components/organisms/MSidebar';
import RuleCheckList from '@/components/organisms/RuleCheckList';
import ShiftAdminTable from '@/components/organisms/ShiftAdminTable';
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import useShiftStore from '@/stores/shiftStore';
import useUserAuthStore from '@/stores/userAuthStore';
import Title from '@/components/atoms/Title';
import { requestService } from '@/services/requestService';
import { useRequestCountStore } from '@/stores/requestCountStore';

const DutyManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { userInfo } = useUserAuthStore();

  const { dutyInfo, loading, error, fetchDutyInfo } = useShiftStore();
  const setRequestCount = useRequestCountStore((state) => state.setCount);

  const isDemo = userInfo?.isDemo;

  useEffect(() => {
    // URL에서 year와 month 파라미터 가져오기
    const url = new URL(window.location.href);
    const urlYear = url.searchParams.get('year');
    const urlMonth = url.searchParams.get('month');

    let logoutTimer: NodeJS.Timeout | null = null;
    if (userInfo?.isDemo) {
      logoutTimer = setTimeout(
        () => {
          alert('체험 시간이 종료되었습니다. 다시 로그인해주세요.');
          useUserAuthStore.getState().logout();
          window.location.href = '/';
        },
        60 * 60 * 1000
      );
    }

    // year가 2000-2099 범위를 벗어나거나 유효하지 않은 숫자인 경우
    if (urlYear) {
      const yearNum = parseInt(urlYear);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2099) {
        window.location.href = '/error';
        return;
      }
    }

    // month가 1-12 범위를 벗어나거나 유효하지 않은 숫자인 경우
    if (urlMonth) {
      const monthNum = parseInt(urlMonth);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        window.location.href = '/error';
        return;
      }
    }

    // URL에 파라미터가 있으면 해당 값으로, 없으면 undefined로 호출
    fetchDutyInfo(
      urlYear ? parseInt(urlYear) : undefined,
      urlMonth ? parseInt(urlMonth) : undefined
    );

    // 대기 중인 요청 개수 가져오기
    const fetchRequestCount = async () => {
      if (userInfo?.role === 'HN') {
        try {
          const count = await requestService.getPendingRequestCount();
          setRequestCount(count);
        } catch (error) {
          console.error('Failed to fetch request count:', error);
        }
      }
    };

    fetchRequestCount();

    // cleanup 함수 추가
    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, [userInfo, fetchDutyInfo, setRequestCount]);

  if (loading && !dutyInfo) {
    return <PageLoadingSpinner />;
  }
  if (error) return <div>Error: {error}</div>;
  if (!dutyInfo) return null;

  return (
    <>
      <SEO
        title="근무표 관리 | Dutymate"
        description="근무표를 관리해보세요."
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
          onClose={() => setIsSidebarOpen(false)}
          isDemo={isDemo ?? false}
        />

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 min-w-0 px-[1rem] lg:px-[2rem] py-[1.5rem] h-[calc(100vh-1rem)] lg:h-screen overflow-y-auto">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-3 lg:hidden mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <IoMdMenu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">근무표 관리</h1>
              <p className="text-sm text-gray-500">근무표를 관리해보세요</p>
            </div>
            {isDemo && <DemoTimer />}
          </div>

          {/* 데스크톱 타이틀 */}
          <div className="hidden lg:block mb-4">
            <Title title="근무표 관리" subtitle="근무표를 관리해보세요" />
          </div>

          <div className="flex flex-col gap-[0.75rem] pb-[2rem]">
            <ShiftAdminTable
              dutyData={dutyInfo.duty}
              invalidCnt={dutyInfo.invalidCnt}
              year={dutyInfo.year}
              month={dutyInfo.month}
              onUpdate={fetchDutyInfo}
              issues={dutyInfo.issues}
            />
            <div className="flex flex-col xl:flex-row gap-[1rem] w-full">
              <RuleCheckList />
              <HistoryList />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DutyManagement;
