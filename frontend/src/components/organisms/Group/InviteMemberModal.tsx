import React, { useState } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { FaUserPlus } from 'react-icons/fa';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite?: (email: string) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  onInvite,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  if (!open) return null;

  const handleInvite = () => {
    if (!email.trim()) {
      setModalMessage('이메일을 입력해주세요.');
      setShowModal(true);
      return;
    }
    if (!email.includes('@')) {
      setModalMessage('올바른 이메일 형식이 아닙니다.');
      setShowModal(true);
      return;
    }
    onInvite?.(email);
    onClose();
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
          <h2 className="text-lg font-bold mb-4">친구 초대하기</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            초대할 친구의 이메일을 입력해주세요.
          </p>
          <div className="w-full mb-6">
            <input
              type="email"
              placeholder="이메일 주소 입력"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-primary text-white text-base font-bold py-2 rounded-xl shadow active:bg-primary-dark transition mb-2 flex items-center justify-center gap-2"
            onClick={handleInvite}
          >
            <FaUserPlus className="text-lg" />
            초대하기
          </button>
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

export default InviteMemberModal;
