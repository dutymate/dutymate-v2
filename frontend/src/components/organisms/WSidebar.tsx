'use client';

import React, { useEffect } from 'react';
import { AiFillSchedule } from 'react-icons/ai';
import { BiSolidUserPin } from 'react-icons/bi';
import { FaHospital } from 'react-icons/fa';
import { HiOutlineUsers } from 'react-icons/hi2';
import { IoIosChatboxes } from 'react-icons/io';
import { PiLightbulbFilamentFill } from 'react-icons/pi';
import { SlCalender } from 'react-icons/sl';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Profile from '@/components/atoms/Profile';
import { useRequestCountStore } from '@/stores/requestCountStore';

interface TooltipProps {
  content: string;
  width?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  width = 'w-40',
  children,
}) => {
  return (
    <div className="relative group flex justify-center">
      {children}
      <div
        className={`absolute ${width} bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-full mt-2 text-center ml-8`}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-800"></div>
        {content}
      </div>
    </div>
  );
};

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// 수간호사용 네비게이션
const headNurseNavigation: NavigationItem[] = [
  { name: '듀티표 관리', href: '/shift-admin', icon: SlCalender },
  { name: '병동 관리', href: '/ward-admin', icon: FaHospital },
  { name: '요청 근무 관리', href: '/req-admin', icon: AiFillSchedule },
  { name: '나의 듀티표', href: '/my-shift', icon: BiSolidUserPin },
  { name: '병동 듀티표', href: '/team-shift', icon: HiOutlineUsers },
  { name: '커뮤니티', href: '/community', icon: IoIosChatboxes },
  { name: '튜토리얼', href: '/tutorial', icon: PiLightbulbFilamentFill },
];

// 평간호사용 네비게이션
const staffNurseNavigation: NavigationItem[] = [
  { name: '나의 듀티표', href: '/my-shift', icon: BiSolidUserPin },
  { name: '병동 듀티표', href: '/team-shift', icon: HiOutlineUsers },
  { name: '커뮤니티', href: '/community', icon: IoIosChatboxes },
  { name: '튜토리얼', href: '/tutorial', icon: PiLightbulbFilamentFill },
];

const NavigationItem = React.memo(
  ({ item, isDemo }: { item: NavigationItem; isDemo: boolean }) => {
    const requestCount = useRequestCountStore((state) => state.count);
    const handleClick = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
      if (item.name === '튜토리얼') {
        e.preventDefault();
        window.open(import.meta.env.VITE_TUTORIAL_URL, '_blank');
      }

      if (isDemo && (item.href === '/community' || item.href === '/my-page')) {
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
					font-['Pretendard Variable'] text-[0.9rem] group
					${
            isDemo && (item.href === '/community' || item.href === '/my-page')
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
              isDemo && (item.href === '/community' || item.href === '/my-page')
                ? 'text-gray-400 cursor-not-allowed'
                : isActive
                  ? 'text-primary-dark'
                  : 'text-gray-500 group-hover:text-primary'
            }`,
          })}

          {isDemo &&
          (item.href === '/community' || item.href === '/my-page') ? (
            <Tooltip content="로그인 후 이용 가능합니다." width="w-40">
              <div>
                <span className="font-semibold text-center w-full block">
                  {item.name}
                </span>
              </div>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold">{item.name}</span>
              {item.name === '요청 근무 관리' && requestCount > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {requestCount}
                </span>
              )}
            </div>
          )}
        </Link>
      </li>
    );
  }
);

interface SidebarProps {
  userType: 'HN' | 'RN'; // "head" | "staff" 대신 실제 role 타입 사용
  isDemo: boolean;
}

const Sidebar = ({ userType, isDemo }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation =
    userType === 'HN' ? headNurseNavigation : staffNurseNavigation;

  useEffect(() => {
    if (
      isDemo &&
      (location.pathname === '/community' ||
        location.pathname.startsWith('/community/'))
    ) {
      navigate('/error');
    }
  }, [isDemo, location.pathname, navigate]);

  const handleLogoClick = () => {
    if (userType === 'HN') {
      navigate('/shift-admin');
    } else {
      navigate('/my-shift');
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex flex-col bg-white w-[238px] border-r border-gray-200 rounded-tr-[18.47px] rounded-br-[18.47px] shadow-[0_4.62px_18.47px_rgba(0,0,0,0.05)]">
      {/* Logo */}
      <div className="flex items-center justify-center px-[1.875rem] pt-7">
        <div className="w-[140px] cursor-pointer" onClick={handleLogoClick}>
          <img alt="듀티메이트" src="/images/logo.svg" className="w-full" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 mt-4">
        <div className="flex flex-col space-y-[0.325rem] mb-5">
          {navigation.map((item, index) => (
            <NavigationItem key={index} item={item} isDemo={isDemo} />
          ))}
        </div>
      </nav>
      <Profile />
    </div>
  );
};

export default React.memo(Sidebar);
