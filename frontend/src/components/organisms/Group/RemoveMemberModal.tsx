//내보내기 모달
import React from 'react';

interface RemoveMemberModalProps {
  open: boolean;
  onClose: () => void;
  memberName?: string;
  onRemove?: () => void;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  open,
  onClose,
  memberName,
  onRemove,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 flex flex-col items-center z-10">
        <button
          className="absolute top-4 right-4 text-gray-400 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">멤버 관리</h2>
        <div className="mb-2 text-center">
          {memberName ? (
            <span>
              <b>{memberName}</b>님을 그룹에서 내보내시겠어요?
            </span>
          ) : (
            <span>이 멤버를 그룹에서 내보내시겠어요?</span>
          )}
        </div>
        <div className="mb-4 text-center text-sm text-gray-500">
          제거된 멤버는 다시 초대해야 합니다.
        </div>
        <button
          className="w-full bg-red-500 text-white text-base font-bold py-2 rounded-xl shadow active:bg-red-600 transition"
          onClick={onRemove}
        >
          네, 내보낼게요
        </button>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
