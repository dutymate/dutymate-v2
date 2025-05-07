import { useEffect } from 'react';
import { MdOutlineAccessTime } from 'react-icons/md';

import TimeOut from '@/components/organisms/TimeOut';
import useUserAuthStore from '@/stores/userAuthStore';

const DemoTimer = () => {
  const { userInfo, setTimeout, isTimeout, timeLeft, setTimeLeft } =
    useUserAuthStore();
  const isDemo = userInfo?.isDemo;
  // const [showTimeOut, setShowTimeOut] = useState<boolean>(false);

  const formatTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  useEffect(() => {
    if (!isDemo || isTimeout) return;

    const startTime = sessionStorage.getItem('demo-start-time');
    if (!startTime) return;

    const startTimestamp = parseInt(startTime, 10);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
    const remaining = 60 * 10 - elapsedSeconds; // 10분 타이머

    if (remaining <= 0) {
      setTimeout(true);
      return;
    }
    setTimeLeft(remaining);
  }, [isDemo, isTimeout]);

  useEffect(() => {
    if (!isDemo || timeLeft <= 0 || isTimeout) return;

    const startTime = sessionStorage.getItem('demo-start-time');
    if (!startTime) return;

    const interval = setInterval(() => {
      const startTimestamp = parseInt(startTime, 10);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
      const remaining = 60 * 10 - elapsedSeconds;

      if (remaining <= 0) {
        clearInterval(interval);
        useUserAuthStore.getState().setTimeout(true);
        setTimeLeft(0);
        return;
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo, timeLeft, isTimeout]);

  if (!isDemo) return null;

  return (
    <>
      <div className="fixed top-5 right-5 z-50 bg-primary-10 text-primary rounded-lg px-2.5 py-1.5 flex items-center shadow-lg min-w-[9.5rem] max-w-[90vw]">
        <div className="w-[1.8rem] flex justify-start ml-1">
          <MdOutlineAccessTime className="text-primary text-2xl" />
        </div>
        <div className="ml-1 flex flex-col justify-center text-xs">
          <div className="ml-2 font-semibold text-orange-500 text-left whitespace-nowrap mb-0.5">
            {isTimeout ? '이용 시간 종료' : '이용 가능 시간'}
          </div>
          {timeLeft > 0 && !isTimeout ? (
            <div className="text-[1.1rem] font-bold text-gray-800 tracking-wider min-w-[5.5rem] text-left">
              {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="text-[1.1rem] font-bold text-gray-800 tracking-wider min-w-[5.5rem] text-left">
              00:00:00
            </div>
          )}
        </div>
      </div>
      {isTimeout && <TimeOut />}
    </>
  );
};

export default DemoTimer;
