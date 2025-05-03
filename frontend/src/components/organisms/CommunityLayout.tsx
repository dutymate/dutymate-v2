import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoMdMenu } from 'react-icons/io';
import { IoNewspaperOutline } from 'react-icons/io5';

import DemoTimer from '@/components/atoms/DemoTimer';
import Title from '@/components/atoms/Title';
import CommunityNews from '@/components/organisms/CommunityNews';
import MSidebar from '@/components/organisms/MSidebar';
import Sidebar from '@/components/organisms/WSidebar';
import useUserAuthStore from '@/stores/userAuthStore';

// 모달 컴포넌트
const Modal = ({ isOpen, onClose, children }: any) => {
  useEffect(() => {
    // ESC 키로 모달 닫기
    const handleEsc = (e: any) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모달 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-lg p-0 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

const CommunityLayout = ({ title, subtitle, children }: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const isDemo = userInfo?.isDemo;

  const handleNewsButton = () => {
    setIsNewsModalOpen(true);
  };

  return (
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
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            onClick={handleNewsButton}
            className="flex items-center gap-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
          >
            <IoNewspaperOutline className="w-5 h-5" />
            <span className="text-sm font-medium">뉴스</span>
          </button>
          {isDemo && <DemoTimer />}
        </div>

        {/* 데스크톱 타이틀 */}
        <div className="hidden lg:block">
          <Title title={title} subtitle={subtitle} />
        </div>

        <Modal
          isOpen={isNewsModalOpen}
          onClose={() => setIsNewsModalOpen(false)}
        >
          <CommunityNews onClose={() => setIsNewsModalOpen(false)} />
        </Modal>

        {/* 컨텐츠와 뉴스 영역 */}
        <div className="mt-6 flex gap-6">
          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0">{children}</div>
          {/* 뉴스 영역 */}
          <div className="hidden lg:block w-[22rem] shrink-0">
            <CommunityNews />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityLayout;
