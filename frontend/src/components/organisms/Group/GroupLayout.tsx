import MSidebar from '@/components/organisms/MSidebar';
import WSidebar from '@/components/organisms/WSidebar';
import Title from '@/components/atoms/Title';
import useUserAuthStore from '@/stores/userAuthStore';
import { useState } from 'react';

export default function GroupLayout({
  children,
}: { children: React.ReactNode }) {
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="w-full h-screen flex flex-row bg-[#F4F4F4]">
      <div className="hidden lg:block w-[14.875rem] shrink-0">
        <WSidebar
          userType={userInfo?.role as 'HN' | 'RN'}
          isDemo={isDemo ?? false}
        />
      </div>
      <MSidebar
        userType={userInfo?.role as 'HN' | 'RN'}
        isDemo={isDemo ?? false}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 overflow-y-auto">
        <div className="hidden lg:block mb-3">
          <Title
            title="친구 찾기"
            subtitle="그룹을 만들어 친구들끼리 근무표를 공유해보세요"
          />
        </div>
        <div className="flex items-center gap-3 lg:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <span className="w-6 h-6 text-gray-600">☰</span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">친구 그룹</h1>
            <p className="text-sm text-gray-500">
              그룹을 만들어 친구들끼리 근무표를 공유해보세요
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
