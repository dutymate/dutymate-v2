import { Button } from '@/components/atoms/Button';
import { useEffect, useState } from 'react';

// GA4 타입 선언 (전역 Window 타입에 gtag 추가)
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface AutoGenCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  autoGenCnt: number;
  onOpenPayment: () => void; // 결제 모달 열기 함수 추가
}

const AutoGenCountModal = ({
  isOpen,
  onClose,
  onConfirm,
  autoGenCnt,
  onOpenPayment,
}: AutoGenCountModalProps) => {
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

  // 자동 생성 횟수가 0 이하일 때는 모달을 표시하지 않고 바로 결제창으로 이동
  if (isOpen && autoGenCnt <= 0) {
    onClose();
    onOpenPayment();
    return null;
  }

  if (!isOpen) {
    return null;
  }

  // 자동 생성 횟수에 따라 타이틀과 메시지 변경
  const title =
    autoGenCnt > 0
      ? '자동 생성 사용 가능 횟수가 1회 차감돼요'
      : '자동 생성 사용 가능 횟수가 부족해요';

  const handleClose = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: 'modal',
        event_action: 'close',
        event_label: 'auto_gen_count_modal',
        event_id: `close-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
        remaining_count: autoGenCnt,
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'close_modal', {
          action_category: 'modal',
          modal_type: 'auto_gen_count',
          view_type: isMobile ? 'mobile' : 'desktop',
          remaining_count: autoGenCnt,
        });
      }
    }

    onClose();
  };

  // 이 함수가 문제가 있습니다. 수정합니다.
  const handleButtonClick = () => {
    // GTM 이벤트 트래킹
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      window.dataLayer.push({
        event: 'button_click',
        event_category: autoGenCnt <= 0 ? 'payment' : 'auto_generate',
        event_action: 'click',
        event_label: autoGenCnt <= 0 ? 'open_payment' : 'start_auto_generate',
        event_id:
          autoGenCnt <= 0
            ? `open-payment-button`
            : `start-auto-generate-button`,
        view_type: isMobile ? 'mobile' : 'desktop',
        remaining_count: autoGenCnt,
      });

      // GA4 직접 이벤트 전송 (gtag 함수 사용)
      if (typeof window.gtag === 'function') {
        window.gtag(
          'event',
          autoGenCnt <= 0 ? 'open_payment' : 'start_auto_generate',
          {
            action_category: autoGenCnt <= 0 ? 'payment' : 'auto_generate',
            view_type: isMobile ? 'mobile' : 'desktop',
            remaining_count: autoGenCnt,
          }
        );
      }
    }

    if (autoGenCnt <= 0) {
      // 횟수가 0 이하인 경우 결제 모달 열기
      onClose();
      onOpenPayment();
    } else {
      // 횟수가 있는 경우 자동 생성 실행
      onClose();
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-[90%] max-w-[22.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 제목 */}
          <h2 className="text-[0.9375rem] font-medium text-left mb-2">
            {title}
          </h2>

          {/* 메시지 표시 */}
          <p className="text-left mb-6 text-[0.9375rem]">
            사용 가능 횟수가{' '}
            <span className="text-primary font-medium">{autoGenCnt}회</span>{' '}
            남았어요.
          </p>

          {/* 버튼 영역 */}
          <div className="flex gap-2">
            <Button
              size="md"
              color="muted"
              onClick={handleClose}
              className="flex-1 bg-[#F1F1F1] hover:bg-[#E5E5E5] active:bg-[#DADADA] text-black font-normal rounded-xl py-3 transition-colors"
              id="close-button"
            >
              취소
            </Button>
            <Button
              size="md"
              color="primary"
              onClick={handleButtonClick} // 이 함수가 제대로 동작해야 함
              className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors"
              id={
                autoGenCnt <= 0
                  ? `open-payment-button`
                  : `start-auto-generate-button`
              }
            >
              생성하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoGenCountModal;
