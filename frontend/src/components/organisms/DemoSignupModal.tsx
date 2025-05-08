import { useEffect } from 'react';
import useUserAuthStore from '@/stores/userAuthStore';

interface DemoSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  onContinue: () => void;
}

const formatTime = (sec: number) => {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const DemoSignupModal = ({
  isOpen,
  onClose,
  onSignup,
  onContinue,
}: DemoSignupModalProps) => {
  const { userInfo, timeLeft, isTimeout } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  useEffect(() => {
    if (!isOpen || !isDemo || isTimeout) return;

    // If timer reaches 0 while modal is open, close it
    if (timeLeft <= 0) {
      onClose();
    }
  }, [isOpen, timeLeft, onClose, isDemo, isTimeout]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-[90%] max-w-[22.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 제목 */}
          <h2 className="text-lg font-bold text-gray mb-4">
            자동 생성 사용 가능 횟수가 부족해요
          </h2>

          {/* 설명 */}
          <div className="text-mid text-gray-700 mb-8">
            남은 체험판 사용 가능 시간은{' '}
            <span className="text-primary font-bold">
              {formatTime(timeLeft)}
            </span>
            입니다.
          </div>

          {/* 버튼 영역 */}
          <div className="flex w-full gap-2">
            <button
              onClick={onContinue}
              className="flex-1 py-3 rounded-xl text-mid font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            >
              계속 체험하기
            </button>
            <button
              onClick={onSignup}
              className="flex-1 py-3 rounded-xl text-mid font-bold bg-primary text-white hover:bg-primary-dark   transition-colors"
            >
              회원가입 하러가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSignupModal;
