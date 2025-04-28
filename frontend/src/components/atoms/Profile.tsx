import useUserAuthStore from '@/store/userAuthStore';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { MdOutlineAccessTime } from 'react-icons/md';
import { Tooltip } from './Tooltip';

const Profile = () => {
  const { userInfo } = useUserAuthStore();
  const location = useLocation();

  const isMypage = location.pathname === '/my-page';
  const privacyPolicyUrl = import.meta.env.VITE_PRIVACY_POLICY_URL || '#';

  const isDemo = userInfo?.isDemo;
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const formatTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (!isDemo) return;

    const startTime = sessionStorage.getItem('demo-start-time');
    if (!startTime) return;

    const startTimestamp = parseInt(startTime, 10);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
    const remaining = 60 * 10 - elapsedSeconds;

    if (remaining <= 0) {
      useUserAuthStore.getState().logout();
      window.location.href = '/';
    } else {
      setTimeLeft(remaining);
    }
  }, [isDemo]);

  // 3️⃣ 1초마다 줄어드는 타이머 추가
  useEffect(() => {
    if (!isDemo || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          useUserAuthStore.getState().logout();
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo, timeLeft]);

  return (
    <div className="px-[1.3rem] pb-10">
      <div className="flex flex-col">
        {/* ✅ 데모 타이머 */}
        {isDemo && timeLeft !== null && (
          <div className="hidden lg:flex items-center justify-start bg-primary-10 text-primary rounded-lg px-4 py-2 mb-4">
            {/* 아이콘 */}
            <div className="w-[2.4rem] flex justify-start ml-2">
              <MdOutlineAccessTime className="text-primary text-5xl" />
            </div>

            {/* 오른쪽 영역: 타이틀 + 숫자 */}
            <div className="ml-2 flex flex-col justify-center text-sm">
              {/* ⬇️ 타이틀을 숫자와 분리 */}
              <div className="ml-4 font-semibold text-orange-500 text-left whitespace-nowrap mb-1">
                이용 가능 시간
              </div>

              {/* 타이머 숫자 */}
              <div className="text-[1.5rem] font-bold text-gray-800 tracking-wider min-w-[7.5rem] text-left">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}
        {isDemo ? (
          <Tooltip content="로그인 후 이용 가능합니다." width="w-40">
            <div>
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className={`
          flex items-center gap-x-6 px-4 mb-4 rounded-lg py-2
          text-gray-400 cursor-not-allowed
        `}
              >
                {userInfo?.profileImg ? (
                  <img
                    src={userInfo.profileImg}
                    alt="프로필 이미지"
                    className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] text-gray-500 rounded-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Icon
                    name="user"
                    className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] rounded-full text-gray-500"
                  />
                )}
                <span className="text-sm font-semibold">마이페이지</span>
              </Link>
            </div>
          </Tooltip>
        ) : (
          <Link
            to={isDemo ? '#' : '/my-page'}
            onClick={(e) => {
              if (isDemo) e.preventDefault();
            }}
            className={`
						flex items-center gap-x-6 px-4 mb-4 rounded-lg py-2

						${
              isMypage
                ? 'bg-gray-100 text-gray-700'
                : isDemo
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }

					`}
          >
            {userInfo?.profileImg ? (
              <img
                src={userInfo.profileImg}
                alt="프로필 이미지"
                className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] text-gray-500 rounded-full"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Icon
                name="user"
                className={`w-[1.125rem] h-[1.125rem] min-w-[1.125rem] rounded-full
								${isMypage ? 'text-primary-dark' : 'text-gray-500'}
							`}
              />
            )}

            <span className="text-sm font-semibold">마이페이지</span>
          </Link>
        )}

        {/* 가운데 정렬된 선 */}
        <div className="mx-2 mb-4">
          <div className="border-t border-gray-200 w-full"></div>
        </div>

        {/* 회사명과 사이트 주소 */}
        <div className="flex flex-col gap-y-1 px-4">
          <span className="text-xs font-bold text-gray-600">
            (주)듀티메이트
          </span>
          <span className="text-xs text-gray-400">
            <a href={privacyPolicyUrl}>개인정보처리방침</a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Profile);
