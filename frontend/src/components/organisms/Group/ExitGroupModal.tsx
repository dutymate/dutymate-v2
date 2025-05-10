//그룹 나가기 & 리더 권한 넘기기 모달
import React, { useState } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';

interface ExitGroupModalProps {
  open: boolean;
  onClose: () => void;
  isLeader?: boolean;
  onExit?: () => void;
  onTransfer?: () => void;
}

const ExitGroupModal: React.FC<ExitGroupModalProps> = ({
  open,
  onClose,
  isLeader = false,
  onTransfer,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  if (!open) return null;

  const handleExit = () => {
    if (isLeader) {
      setModalMessage(
        '그룹을 나가기 전에 리더 권한을 다른 멤버에게 넘겨주세요.'
      );
      setShowModal(true);
    } else {
      // onExit?.();
      onClose(); // Just close the modal
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
        <div className="absolute inset-0" onClick={onClose} />
        <div
          className={`
            relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
            ${isMobile ? 'max-w-full pb-4 pt-2 px-4 animate-slideup' : 'max-w-sm p-5'}
            flex flex-col items-center
            z-10
          `}
          style={isMobile ? { bottom: 0 } : {}}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 text-xl"
            onClick={onClose}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-4">그룹 나가기</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            {isLeader
              ? '그룹을 나가기 전에 리더 권한을 다른 멤버에게 넘겨주세요.'
              : '정말로 그룹을 나가시겠습니까?'}
          </p>
          {isLeader ? (
            <button
              className="w-full bg-primary text-white text-base font-bold py-2 rounded-xl shadow active:bg-primary-dark transition mb-2"
              onClick={onTransfer}
            >
              리더 권한 넘기기
            </button>
          ) : (
            <button
              className="w-full bg-red-500 text-white text-base font-bold py-2 rounded-xl shadow active:bg-red-600 transition mb-2"
              onClick={handleExit}
            >
              그룹 나가기
            </button>
          )}
        </div>
      </div>

      {/* 알림 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center">
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

export default ExitGroupModal;
