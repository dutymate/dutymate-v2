import { useState, useRef } from 'react';
import { IoMdMenu } from 'react-icons/io';
import { FaPlus } from 'react-icons/fa';

import AdminReqShiftModal from '@/components/organisms/AdminReqShiftModal';
import { Button } from '@/components/atoms/Button';
import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import MSidebar from '@/components/organisms/MSidebar';
import ReqAdminTable from '@/components/organisms/ReqAdminTable';
import Sidebar from '@/components/organisms/WSidebar';
import { SEO } from '@/components/SEO';
import useUserAuthStore from '@/stores/userAuthStore';
import { Icon } from '@/components/atoms/Icon';

const ReqAdmin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;
  const tableRef = useRef<{ fetchRequests: () => Promise<void> }>(null);

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
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Icon name="more" size={20} className="text-gray-600" />
              </button>

              {/* 드롭다운 메뉴와 오버레이 */}
              {isDropdownOpen && (
                <>
                  {/* 오버레이 - 외부 클릭 시 닫힘 */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />

                  {/* 드롭다운 메뉴 */}
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span>요청생성</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            {isDemo && <DemoTimer />}
          </div>

          {/* 데스크톱 타이틀 */}
          <div className="hidden lg:flex justify-between items-center">
            <Title
              title="요청 근무 관리"
              subtitle="간호사들의 근무 요청을 관리해보세요"
            />
            <Button
              size="lg"
              color="primary"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-2 py-2 whitespace-nowrap -ml-2"
            >
              <FaPlus className="w-4 h-4" />
              <span className="text-lg text-muted-500">요청생성</span>
            </Button>
          </div>

          <div className="mt-6">
            <ReqAdminTable ref={tableRef} />
          </div>
        </div>
      </div>

      {/* 관리자용 근무 요청 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AdminReqShiftModal
            onClose={() => setIsModalOpen(false)}
            onRequestCreated={() => tableRef.current?.fetchRequests()}
          />
        </div>
      )}
    </>
  );
};

export default ReqAdmin;
