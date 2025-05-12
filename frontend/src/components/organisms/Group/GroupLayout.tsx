import MSidebar from '@/components/organisms/MSidebar';
import WSidebar from '@/components/organisms/WSidebar';
import Title from '@/components/atoms/Title';
import useUserAuthStore from '@/stores/userAuthStore';
import { useState } from 'react';
import { IoMdMenu } from 'react-icons/io';

interface GroupLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function GroupLayout({
  children,
  title,
  subtitle,
}: GroupLayoutProps) {
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
            title={title || '친구 찾기'}
            subtitle={
              subtitle || '그룹을 만들어 친구들끼리 근무표를 공유해보세요'
            }
          />
        </div>
        <div className="flex items-center gap-3 lg:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <IoMdMenu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{title || '친구 그룹'}</h1>
            <p className="text-sm text-gray-500">
              {subtitle || '그룹을 만들어 친구들끼리 근무표를 공유해보세요'}
            </p>
          </div>
        </div>
        <div className="w-full max-w-[758px] pt-2">{children}</div>
      </div>
    </div>
  );
}
