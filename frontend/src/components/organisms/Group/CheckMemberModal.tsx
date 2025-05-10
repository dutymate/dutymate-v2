// import React from 'react';

// import React, { useState } from 'react';
import { FaCrown } from 'react-icons/fa';

interface Member {
  name: string;
  isLeader?: boolean;
}

interface CheckMemberModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
  selectedMembers: string[];
  setSelectedMembers: (names: string[]) => void;
}

const CheckMemberModal: React.FC<CheckMemberModalProps> = ({
  open,
  onClose,
  members,
  selectedMembers,
  setSelectedMembers,
}) => {
  if (!open) return null;

  const handleToggle = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter((n) => n !== name));
    } else {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl p-6 z-10 animate-slideup">
        <button
          className="absolute top-4 right-4 text-gray-400 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <div className="text-xl font-semibold mb-6">인원 선택하기</div>
        <div className="flex flex-wrap gap-3 mb-10">
          {members.map((m) => (
            <button
              key={m.name}
              className={`
                flex items-center px-5 py-2 rounded-xl border text-base font-semibold transition
                ${
                  selectedMembers.includes(m.name)
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-white border-gray-300 text-gray-500'
                }
              `}
              style={{ minWidth: 90 }}
              onClick={() => handleToggle(m.name)}
            >
              {m.isLeader && (
                <FaCrown className="mr-1 text-yellow-400 text-lg" />
              )}
              {m.name}
            </button>
          ))}
        </div>
        <button
          className="w-full bg-gray-700 text-white text-lg font-bold py-3 rounded-xl shadow mt-2 active:bg-gray-800 transition"
          onClick={onClose}
        >
          약속 날짜 추천받기
        </button>
      </div>
    </div>
  );
};

export default CheckMemberModal;
