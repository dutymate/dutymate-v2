import { AxiosError } from 'axios';
import { useState } from 'react';
import { IoMdMenu } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Button } from '@/components/atoms/Button';
import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import MypagePassword from '@/components/organisms/MypagePassword';
import MypageProfile from '@/components/organisms/MypageProfile';
import MSidebar from '@/components/organisms/MSidebar';
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import { ApiErrorResponse, profileService } from '@/services/profileService';
import useUserAuthStore from '@/stores/userAuthStore';

const Mypage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const navigate = useNavigate();
  const userAuthStore = useUserAuthStore();

  const handleLogoutButton = async () => {
    try {
      await profileService.logout(
        () => {
          userAuthStore.logout();
          toast.success('로그아웃되었습니다.');
          navigate('/login');
        },
        (error: ApiErrorResponse) => {
          if (error instanceof Error) {
            if (error.message === '서버 연결 실패') {
              toast.error('잠시 후 다시 시도해주세요.');
              return;
            }
            if (error.message === 'UNAUTHORIZED') {
              navigate('/login');
              return;
            }
          }
          if ((error as unknown as AxiosError)?.response?.status === 400) {
            toast.error('잘못된 요청입니다.');
            return;
          }
          // 그 외의 모든 에러는 에러 페이지로 이동
          navigate('/error');
        }
      );
    } catch (error) {
      navigate('/error');
    }
  };

  const isDemo = userInfo?.isDemo;

  return (
    <>
      <SEO
        title="마이페이지 | Dutymate"
        description="듀티메이트의 마이페이지입니다."
      />

      <div className="w-full min-h-screen flex flex-row bg-[#F4F4F4]">
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
        <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 overflow-y-auto">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-3 lg:hidden mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <IoMdMenu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">마이페이지</h1>
              <p className="text-sm text-gray-500 truncate">
                나의 정보를 확인해보세요
              </p>
            </div>
            {!isDemo ? (
              <Button
                onClick={handleLogoutButton}
                color="evening"
                size="sm"
                width="fit"
                className="flex-shrink-0 !w-[5rem] !h-[2rem] text-sm"
              >
                로그아웃
              </Button>
            ) : (
              <DemoTimer />
            )}
          </div>

          {/* 데스크톱 타이틀 */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <Title title="마이페이지" subtitle="나의 정보를 확인해보세요" />
            {!isDemo && (
              <div className="flex items-center">
                <div className="h-8 w-px bg-gray-300 mx-4"></div>
                <Button
                  onClick={handleLogoutButton}
                  color="evening"
                  size="sm"
                  width="fit"
                  className="flex-shrink-0 !w-[6rem] !h-[2rem] text-base"
                >
                  로그아웃
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-full lg:w-[87.5rem] space-y-4">
              <MypageProfile />
              {!isDemo && <MypagePassword />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Mypage;
