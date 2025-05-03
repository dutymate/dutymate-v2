import React from 'react';
import { FaRegCheckCircle } from 'react-icons/fa';

interface SelectCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectCompleteModal = ({ isOpen, onClose }: SelectCompleteModalProps) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-[90%] max-w-[400px] p-8 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* 체크 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#FFD7D0] flex items-center justify-center">
            <FaRegCheckCircle className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* 텍스트 */}
        <h2 className="text-xl font-medium text-center mb-2">선택 완료!</h2>
        <p className="text-center text-gray-600 text-sm leading-relaxed">
          해당 플랜은 결제가 진행되지 않으며,
          <br />
          기능 체험용으로 제공됩니다.
          <br />
          지금 바로 사용해보세요.
        </p>
      </div>
    </div>
  );
};

export default SelectCompleteModal;
