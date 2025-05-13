import { useState, useEffect } from 'react';

import { Button } from '@/components/atoms/Button';
import RuleEditModal from '@/components/organisms/RuleEditModal';
import { WardRule } from '@/services/ruleService';

// GA4 타입 선언 (전역 Window 타입에 gtag 추가)
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface AutoGenerateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onModify: (newRules: WardRule) => void;
  wardRules: WardRule | null;
  autoGenCnt: number;
}

// 중요도에 따른 폰트 굵기 설정 함수
const getFontWeight = (value: number) => {
  switch (value) {
    case 3:
      return 'font-bold';
    case 2:
      return 'font-medium';
    case 1:
      return 'font-light';
    default:
      return 'font-normal';
  }
};

// 중요도 텍스트 변환 함수
const getPriorityText = (value: number) => {
  switch (value) {
    case 3:
      return '매우 중요';
    case 2:
      return '중요';
    case 1:
      return '보통';
    default:
      return '';
  }
};

const AutoGenerateConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  wardRules,
  autoGenCnt,
}: AutoGenerateConfirmModalProps) => {
  // 모바일 여부 상태 추가
  const [isMobile, setIsMobile] = useState(false);
  // 규칙 수정 모달 상태 관리
  const [isRuleEditModalOpen, setIsRuleEditModalOpen] = useState(false);
  // 업데이트된 규칙 상태 관리
  const [updatedRules, setUpdatedRules] = useState<WardRule | null>(null);

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

  // 열려있지 않거나 규칙이 없는 경우 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  // 규칙이 없는 경우도 렌더링하지 않음
  if (!wardRules) {
    return null;
  }

  // 자동 생성 횟수가 0 이하일 때는 모달을 표시하지 않음
  if (autoGenCnt <= 0) {
    return null;
  }

  // 규칙이 없는 경우도 렌더링하지 않음
  const currentRules = updatedRules || wardRules;
  if (!currentRules) return null;

  // 규칙 수정 모달 열기
  const handleOpenRuleEditModal = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'rule_management',
        event_action: 'click',
        event_label: 'open_rule_edit',
        event_id: `edit-rule-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'open_rule_edit', {
          action_category: 'rule_management',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    setIsRuleEditModalOpen(true);
  };

  // 규칙 수정 완료 처리
  const handleRuleUpdateFromAutoGenerate = (newRules: WardRule) => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'rule_update',
        event_category: 'rule_management',
        event_action: 'update',
        event_label: 'rule_updated',
        event_id: `rule-update`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });
    }

    setUpdatedRules(newRules);
    setIsRuleEditModalOpen(false);
  };

  // 확인 완료 버튼 클릭 처리
  const handleConfirm = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'auto_generate',
        event_action: 'click',
        event_label: 'confirm_rules',
        event_id: `confirm-rules-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'confirm_rules', {
          action_category: 'auto_generate',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    onConfirm();
  };

  // 모달 닫기 처리
  const handleClose = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'modal',
        event_action: 'close',
        event_label: 'auto_generate_confirm_modal',
        event_id: `close-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'close_modal', {
          action_category: 'modal',
          modal_type: 'auto_generate_confirm',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    onClose();
  };

  // 전담 근무 배정하기 버튼 클릭 처리
  const handleAssignDedicated = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'ward_management',
        event_action: 'click',
        event_label: 'assign_dedicated',
        event_id: `assign-dedicated-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'assign_dedicated', {
          action_category: 'ward_management',
          view_type: isMobile ? 'mobile' : 'desktop',
        });
      }
    }

    window.location.href = '/ward-admin';
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-lg w-[22.5rem] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-[1rem] py-[0.25rem] border-b">
            <h2 className="text-sm font-medium text-primary-dark">
              병동 듀티 규칙 확인
            </h2>
            <button
              onClick={handleClose}
              className="text-primary hover:text-primary/80"
              id="close-button"
            >
              <span className="text-lg">×</span>
            </button>
          </div>

          {/* 내용 */}
          <div className="p-[1rem]">
            <div className="space-y-[0.5rem]">
              {/* 안내 멘트 */}
              <div className="flex items-center justify-center gap-[0.25rem] py-[0.5rem] px-[0.25rem] bg-gray-50 rounded font-bold text-sm text-primary">
                <span>병동 듀티 규칙을 확인해주세요.</span>
              </div>

              {/* 평일 근무자 수 */}
              <div className="flex items-center justify-between py-[0.1rem] border-b">
                <span className="text-sm text-foreground">평일 근무자 수</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-day">D</span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wdayDCnt}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-evening">
                      E
                    </span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wdayECnt}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-night">
                      N
                    </span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wdayNCnt}명
                    </span>
                  </div>
                </div>
              </div>

              {/* 주말 근무자 수 */}
              <div className="flex items-center justify-between py-[0.5rem] border-b">
                <span className="text-sm text-foreground">주말 근무자 수</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-day">D</span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wendDCnt}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-evening">
                      E
                    </span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wendECnt}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-duty-night">
                      N
                    </span>
                    <span className="text-sm w-[1.5rem] text-center">
                      {currentRules.wendNCnt}명
                    </span>
                  </div>
                </div>
              </div>

              {/* 전담 근무 설정 버튼 */}
              <div className="flex items-center justify-end py-[0.5rem] border-b">
                <div className="relative group">
                  <button
                    onClick={handleAssignDedicated}
                    className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    id="assign-dedicated-button"
                  >
                    전담 근무 배정하기
                  </button>
                  <div className="absolute right-0 top-full mt-1 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
                    평일 D 고정, N 킵 인원을 추가해보세요!
                  </div>
                </div>
              </div>

              {/* 연속 근무 규칙 */}
              <div className="flex items-center justify-between py-[0.5rem] border-b">
                <span className="text-sm text-foreground">
                  연속 근무 수 최대
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">
                    {currentRules.maxShift}일 이하
                  </span>
                  <span
                    className={`text-xs ml-2 ${getFontWeight(currentRules.prioMaxShift)}`}
                  >
                    {getPriorityText(currentRules.prioMaxShift)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-[0.5rem] border-b">
                <span className="text-sm text-foreground">
                  나이트 연속 최대
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{currentRules.maxN}일 이하</span>
                  <span
                    className={`text-xs ml-2 ${getFontWeight(currentRules.prioMaxN)}`}
                  >
                    {getPriorityText(currentRules.prioMaxN)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-[0.5rem] border-b">
                <span className="text-sm text-foreground">
                  나이트 연속 최소
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{currentRules.minN}일 이상</span>
                  <span
                    className={`text-xs ml-2 ${getFontWeight(currentRules.prioMinN)}`}
                  >
                    {getPriorityText(currentRules.prioMinN)}
                  </span>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-[0.25rem] mt-[1rem]">
              <Button
                size="xs"
                color="muted"
                onClick={handleOpenRuleEditModal}
                id="edit-rule-button"
              >
                수정하기
              </Button>
              <Button
                size="xs"
                color="primary"
                onClick={handleConfirm}
                id="confirm-rules-button"
              >
                확인 완료
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 규칙 수정 모달 */}
      {isRuleEditModalOpen && (
        <RuleEditModal
          onClose={() => setIsRuleEditModalOpen(false)}
          buttonRef={null as any}
          onRuleUpdate={() => {}}
          isFromAutoGenerate={true}
          onRuleUpdateFromAutoGenerate={handleRuleUpdateFromAutoGenerate}
        />
      )}
    </>
  );
};

export default AutoGenerateConfirmModal;
