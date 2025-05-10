import React, { useState } from 'react';

interface ShareDateModalProps {
  open: boolean;
  onClose: () => void;
}

const ShareDateModal: React.FC<ShareDateModalProps> = ({ open, onClose }) => {
  const link = window.location.href;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setModalMessage('링크가 복사되었습니다!');
      setShowModal(true);
    } catch {
      setModalMessage('복사에 실패했습니다.');
      setShowModal(true);
    }
  };

  const handleOutsideClick = () => {
    onClose();
    setShowModal(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="absolute inset-0" onClick={handleOutsideClick} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 flex flex-col items-center z-10">
          <button
            className="absolute top-4 right-4 text-gray-400 text-2xl"
            onClick={handleOutsideClick}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-4">날짜 공유 링크</h2>
          <div className="w-full bg-gray-100 rounded px-3 py-2 text-xs text-gray-700 break-all mb-4 text-center">
            {link}
          </div>
          <button
            className="w-full bg-primary text-white text-base font-bold py-2 rounded-xl shadow active:bg-primary-dark transition"
            onClick={handleCopy}
          >
            링크 복사하기
          </button>
        </div>
      </div>

      {/* 알림 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="absolute inset-0" onClick={handleOutsideClick} />
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center relative z-10">
            <div className="text-base font-semibold mb-4">{modalMessage}</div>
            <button
              className="mt-2 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow hover:bg-primary-dark transition"
              onClick={() => setShowModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareDateModal;
