import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

interface NurseShortageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceGenerate: () => Promise<void>;
  onAddTemporaryNurses: (count: number) => void;
  neededNurseCount: number;
  currentNurseCount: number;
}

const NurseShortageModal: React.FC<NurseShortageModalProps> = ({
  isOpen,
  onClose,
  onForceGenerate,
  onAddTemporaryNurses,
  neededNurseCount,
  currentNurseCount,
}) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const additionalNursesNeeded = neededNurseCount - currentNurseCount;
  const [tempNurseCount, setTempNurseCount] = useState(0);

  const handleAddNurse = () => {
    onClose();
    navigate('/ward-admin');
  };

  const handleForceGenerate = async () => {
    try {
      setIsGenerating(true);
      await onForceGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTemporary = () => {
    if (tempNurseCount <= 0) return;
    onAddTemporaryNurses(tempNurseCount);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-[22.5rem]">
        <div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-4 py-2 border-b">
          <h2 className="text-sm font-medium text-primary-dark">
            간호사 인원이 부족해요
          </h2>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary/80"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-600 mb-6">
            <p className="mb-2">
              현재 모든 인원의 <span className="font-bold">법정 공휴일</span>을
              보장할 수 없습니다.
            </p>
            <p>
              근무를 위해 최소{' '}
              <span className="font-bold text-primary">
                {additionalNursesNeeded}명
              </span>
              의 간호사가 더 필요합니다.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium mb-3">임시 간호사 추가</h3>
            <div className="flex items-center justify-center gap-4 mb-2">
              <button
                onClick={() =>
                  setTempNurseCount(Math.max(0, tempNurseCount - 1))
                }
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-medium"
              >
                -
              </button>
              <span className="text-xl font-medium w-12 text-center">
                {tempNurseCount}
              </span>
              <button
                onClick={() =>
                  setTempNurseCount(
                    Math.min(additionalNursesNeeded, tempNurseCount + 1)
                  )
                }
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-medium"
                disabled={tempNurseCount >= additionalNursesNeeded}
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {tempNurseCount < additionalNursesNeeded ? (
                <span className="text-duty-evening-dark">
                  아직 {additionalNursesNeeded - tempNurseCount}명이 부족해요
                </span>
              ) : (
                <span className="text-duty-day-dark">
                  필요한 인원이 충족되었어요
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="register"
              color="primary"
              onClick={handleAddTemporary}
              disabled={tempNurseCount <= 0}
              className="w-full"
            >
              임시 간호사 {tempNurseCount}명 추가하기
            </Button>
            <div className="flex justify-between gap-2">
              <Button
                size="register"
                color="off"
                onClick={handleAddNurse}
                className="flex-1"
              >
                병동 관리로 이동
              </Button>
              <Button
                size="register"
                color="evening"
                onClick={handleForceGenerate}
                className="flex-1"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-1.5 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                    자동생성 중...
                  </div>
                ) : (
                  '그대로 자동생성'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseShortageModal;
