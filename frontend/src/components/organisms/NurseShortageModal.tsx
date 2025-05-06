import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';

interface NurseShortageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceGenerate: () => void;
  neededNurseCount: number;
  currentNurseCount: number;
}

const NurseShortageModal = ({
  isOpen,
  onClose,
  onForceGenerate,
  neededNurseCount,
  currentNurseCount,
}: NurseShortageModalProps) => {
  const navigate = useNavigate();
  const additionalNursesNeeded = neededNurseCount - currentNurseCount;

  const handleAddNurse = () => {
    onClose();
    navigate('/ward-admin');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-[22.5rem] max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-[1rem] py-[0.25rem] border-b">
          <h2 className="text-sm font-medium text-primary-dark">
            간호사 인원이 부족해요.
          </h2>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary/80"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            현재 모든 인원의 <span className="font-bold">법정 공휴일</span>을 보장할 수 없습니다.
            <br />
            근무를 위해 최소 <span className="font-bold text-primary">{additionalNursesNeeded}명</span>의 간호사가 더 필요합니다.
            <br />
            이대로 자동생성을 진행하시겠습니까?
          </p>
          <div className="flex justify-center gap-6">
            <Button
              size="register"
              color="primary"
              onClick={handleAddNurse}
            >
              인원추가
            </Button>
            <Button
              size="register"
              color="evening"
              onClick={onForceGenerate}
            >
              자동생성
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseShortageModal; 