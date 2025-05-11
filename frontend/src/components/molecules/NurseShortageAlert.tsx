import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';

interface NurseShortageAlertProps {
  shortage: number;
  onRuleButtonClick: () => void;
}

const NurseShortageAlert = ({
  shortage,
  onRuleButtonClick,
}: NurseShortageAlertProps) => {
  const navigate = useNavigate();

  if (shortage <= 0) return null;

  return (
    <>
      {/* 웹 버전 */}
      <div className="hidden md:block bg-duty-evening-bg/20 border border-duty-evening-dark/20 rounded-xl p-3 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alert" size={18} className="text-duty-evening-dark" />
            <span className="text-sm font-medium text-gray-800">
              현재 병동 규칙으로는 간호사{' '}
              <span className="font-bold text-duty-evening-dark">
                {shortage}명
              </span>{' '}
              부족
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                size="sm"
                color="evening"
                onClick={() => navigate('/ward-admin')}
              >
                간호사 추가
              </Button>
              <Button size="sm" color="primary" onClick={onRuleButtonClick}>
                규칙 수정
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 버전 */}
      <div className="md:hidden bg-duty-evening-bg/20 border border-duty-evening-dark/20 rounded-xl p-2 mb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="alert" size={16} className="text-duty-evening-dark" />
              <span className="text-sm font-medium text-gray-800">
                현재 병동 규칙으로는 간호사가 부족
              </span>
            </div>
            <span className="text-xs bg-duty-evening-bg/40 text-duty-evening-dark px-2 py-0.5 rounded-full font-medium">
              {shortage}명 필요
            </span>
          </div>
          <div className="flex gap-1.5 mt-1">
            <Button
              size="sm"
              color="evening"
              onClick={() => navigate('/ward-admin')}
              className="flex-1"
            >
              간호사 추가
            </Button>
            <Button
              size="sm"
              color="primary"
              onClick={onRuleButtonClick}
              className="flex-1"
            >
              규칙 수정
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NurseShortageAlert;
