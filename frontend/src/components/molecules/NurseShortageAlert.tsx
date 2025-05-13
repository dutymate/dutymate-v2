import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { useEffect, useState } from 'react';

// GA4 타입 선언 (전역 Window 타입에 gtag 추가)
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface NurseShortageAlertProps {
  shortage: number;
  onRuleButtonClick: () => void;
}

const NurseShortageAlert = ({
  shortage,
  onRuleButtonClick,
}: NurseShortageAlertProps) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleAddNurse = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'nurse_management',
        event_action: 'click',
        event_label: 'add_nurse',
        event_id: `add-nurse-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'add_nurse_click', {
          action_category: 'nurse_management',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    navigate('/ward-admin');
  };

  const handleRuleEdit = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'rule_management',
        event_action: 'click',
        event_label: 'edit_rule',
        event_id: `edit-rule-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'edit_rule_click', {
          action_category: 'rule_management',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    onRuleButtonClick();
  };

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
                onClick={handleAddNurse}
                className="add-nurse-button-desktop"
                id="add-nurse-button"
              >
                간호사 추가
              </Button>
              <Button
                size="sm"
                color="primary"
                onClick={handleRuleEdit}
                className="edit-rule-button-desktop"
                id="edit-rule-button"
              >
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
              onClick={handleAddNurse}
              className="flex-1"
              id="add-nurse-button"
            >
              간호사 추가
            </Button>
            <Button
              size="sm"
              color="primary"
              onClick={handleRuleEdit}
              className="flex-1"
              id="edit-rule-button"
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
