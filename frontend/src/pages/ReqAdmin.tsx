import { useState } from 'react';
import { IoMdMenu } from 'react-icons/io';

import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import MSidebar from '@/components/organisms/MSidebar';
import ReqAdminTable from '@/components/organisms/ReqAdminTable';
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import useUserAuthStore from '@/stores/userAuthStore';

const ReqAdmin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  return (
    <>
      <SEO
        title="요청 관리 | Dutymate"
        description="간호사들의 근무 요청을 관리해보세요."
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
          isDemo={isDemo ?? false}
          onClose={() => setIsSidebarOpen(false)}
        />
        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 h-[calc(100vh-1rem)] lg:h-screen overflow-y-auto lg:overflow-x-hidden">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-3 lg:hidden mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <IoMdMenu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">요청 근무 관리</h1>
              <p className="text-sm text-gray-500">
                간호사들의 근무 요청을 관리해보세요
              </p>
            </div>
            {isDemo && <DemoTimer />}
          </div>

          {/* 데스크톱 타이틀 */}
          <div className="hidden lg:block">
            <Title
              title="요청 근무 관리"
              subtitle="간호사들의 근무 요청을 관리해보세요"
            />
          </div>

          <div className="mt-6">
            <ReqAdminTable />
          </div>
        </div>
      </div>
    </>
  );
};

export default ReqAdmin;
