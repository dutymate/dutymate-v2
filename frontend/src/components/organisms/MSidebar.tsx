'use client';

import React, { useState } from 'react';
import { BiSolidUserPin } from 'react-icons/bi';
import { FaHospital, FaCoffee } from 'react-icons/fa';
import { HiOutlineUsers } from 'react-icons/hi2';
import { IoIosChatboxes } from 'react-icons/io';
import { IoCloseOutline } from 'react-icons/io5';
import { PiLightbulbFilamentFill } from 'react-icons/pi';
// import { MdFeedback } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
// import { FaCoffee } from 'react-icons/fa';

import Profile from '@/components/atoms/Profile';
import { useRequestCountStore } from '@/stores/requestCountStore';
import SurveyModal from './SurveyModal';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// 수간호사용 네비게이션
const headNurseNavigation: NavigationItem[] = [
  { name: '듀티표 관리', href: '/shift-admin', icon: BiSolidUserPin },
  { name: '병동 관리', href: '/ward-admin', icon: FaHospital },
  { name: '요청 근무 관리', href: '/req-admin', icon: HiOutlineUsers },
  { name: '나의 듀티표', href: '/my-shift', icon: BiSolidUserPin },
  { name: '병동 듀티표', href: '/team-shift', icon: HiOutlineUsers },
  { name: '커뮤니티', href: '/community', icon: IoIosChatboxes },
  { name: '친구 찾기', href: '/group', icon: FaCoffee },
  { name: '튜토리얼', href: '/tutorial', icon: PiLightbulbFilamentFill },
];

// 평간호사용 네비게이션
const staffNurseNavigation: NavigationItem[] = [
  { name: '나의 듀티표', href: '/my-shift', icon: BiSolidUserPin },
  { name: '병동 듀티표', href: '/team-shift', icon: HiOutlineUsers },
  { name: '커뮤니티', href: '/community', icon: IoIosChatboxes },
  { name: '친구 찾기', href: '/group', icon: FaCoffee },
  { name: '튜토리얼', href: '/tutorial', icon: PiLightbulbFilamentFill },
];

const NavigationItem = React.memo(
  ({
    item,
    isDemo,
    userType,
  }: { item: NavigationItem; isDemo: boolean; userType: 'HN' | 'RN' }) => {
    const requestCount = useRequestCountStore((state) => state.count);
    const demoBlockedRoutes = ['/community', '/my-page'];
    const handleClick = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
      if (item.name === '튜토리얼') {
        e.preventDefault();
        window.open(import.meta.env.VITE_TUTORIAL_URL, '_blank');
      }

      if (
        isDemo &&
        userType === 'HN' &&
        demoBlockedRoutes.includes(item.href)
      ) {
        e.preventDefault();
      }
    };

    const isActive =
      item.href === location.pathname ||
      (location.pathname.startsWith('/community/') &&
        item.href.startsWith('/community'));

    return (
      <li className="flex justify-center px-[1.3rem]">
        <Link
          to={item.name === '튜토리얼' ? '#' : item.href}
          className={`
						flex items-center gap-x-3 px-4 py-2.5 w-full rounded-lg
						text-[0.85rem] lg:text-[0.9rem] group
						font-['Pretendard Variable']
						${
              isDemo &&
              userType === 'HN' &&
              demoBlockedRoutes.includes(item.href)
                ? 'text-gray-400 cursor-not-allowed'
                : isActive
                  ? 'text-primary-dark bg-primary-10'
                  : 'text-gray-700 hover:text-primary hover:bg-primary-10'
            }
					`}
          onClick={handleClick}
        >
          {React.createElement(item.icon, {
            className: `w-4 h-4 min-w-4 ${
              isDemo &&
              userType === 'HN' &&
              demoBlockedRoutes.includes(item.href)
                ? 'text-gray-400 cursor-not-allowed'
                : isActive
                  ? 'text-primary-dark'
                  : 'text-gray-500 group-hover:text-primary'
            }`,
          })}
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold">{item.name}</span>
            {item.name === '요청 근무 관리' && requestCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {requestCount}
              </span>
            )}
          </div>
        </Link>
      </li>
    );
  }
);

interface SidebarProps {
  userType: 'HN' | 'RN';
  isDemo: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ userType, isDemo, isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const navigation =
    userType === 'HN' ? headNurseNavigation : staffNurseNavigation;
  const [showSurvey, setShowSurvey] = useState(false);

  const handleLogoClick = () => {
    if (userType === 'HN') {
      navigate('/shift-admin');
    } else {
      navigate('/my-shift');
    }
    onClose();
  };

  // Close Survey modal handler
  const handleCloseSurvey = () => {
    setShowSurvey(false);
  };

  // 설문조사 데이터 초기화 함수 - 설문조사 테스트 버튼 사용 시 주석 해제
  /*
  const resetSurveyData = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('survey_completed_date');
    localStorage.removeItem('survey_data');
    localStorage.removeItem('payment_modal_closed_time');
    alert('설문조사 데이터가 초기화되었습니다.');
  };
  */

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`
					fixed inset-y-0 left-0 z-40 
					flex flex-col bg-white w-[238px] 
					border-r border-gray-200 
					rounded-tr-[18.47px] rounded-br-[18.47px] 
					shadow-[0_4.62px_18.47px_rgba(0,0,0,0.05)]
					transform transition-transform duration-300 ease-in-out
					${isOpen ? 'translate-x-0' : '-translate-x-full'}
					lg:hidden
				`}
      >
        {/* Logo와 닫기 버튼 */}
        <div className="flex items-center justify-between px-[1.875rem] pt-7">
          <div className="w-[140px] cursor-pointer" onClick={handleLogoClick}>
            <img alt="듀티메이트" src="/images/logo.svg" className="w-full" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 mt-4">
          <div className="flex flex-col space-y-[0.325rem] mb-5">
            {navigation.map((item, index) => (
              <NavigationItem
                key={index}
                item={item}
                isDemo={isDemo}
                userType={userType}
              />
            ))}

            {/* 임시 설문조사 버튼 - 테스트 완료 후 주석 처리 */}
            {/* 
            <li className="flex justify-center px-[1.3rem]">
              <button
                onClick={() => {
                  setShowSurvey(true);
                  onClose();
                }}
                onContextMenu={resetSurveyData}
                className="flex items-center gap-x-3 px-4 py-2.5 w-full rounded-lg
                text-[0.85rem] lg:text-[0.9rem] group
                font-['Pretendard Variable']
                text-gray-700 hover:text-primary hover:bg-primary-10"
                title="오른쪽 클릭으로 설문조사 데이터 초기화"
              >
                <MdFeedback className="w-4 h-4 min-w-4 text-gray-500 group-hover:text-primary" />
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">설문조사 테스트</span>
                </div>
              </button>
            </li>
            */}
          </div>
        </nav>
        <Profile />

        {/* Survey Modal */}
        <SurveyModal isOpen={showSurvey} onClose={handleCloseSurvey} />
      </div>
    </>
  );
};

export default React.memo(Sidebar);
