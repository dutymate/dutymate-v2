import { useState, useEffect, ReactNode } from 'react';
import SurveyModal from './SurveyModal';

// 오프라인 설문 데이터 동기화 함수
const syncOfflineSurveyData = async () => {
  try {
    // 로컬 스토리지에서 설문 데이터 확인
    const surveyData = localStorage.getItem('survey_data');

    if (surveyData) {
      console.log(
        '오프라인에서 저장된 설문 데이터를 확인했습니다:',
        JSON.parse(surveyData)
      );

      // 데이터가 이미 저장되어 있으므로 별도 처리 불필요
      // 여기서 서버 동기화 등의 기능을 추가할 수 있습니다

      // 처리 완료 후 로그 기록
      console.log('설문 데이터 동기화가 완료되었습니다.');
    }
  } catch (error) {
    console.error('설문 데이터 동기화 중 오류 발생:', error);
  }
};

interface SurveyProviderProps {
  children: ReactNode;
}

/**
 * 설문조사를 특정 시점에 자동으로 표시하는 Provider 컴포넌트
 * - PaymentModal에서 벗어난 후 10초 후 팝업
 * - 서비스 사용 5분이 경과한 시점 (300초)
 */
const SurveyProvider = ({ children }: SurveyProviderProps) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasPaymentModalClosed, setHasPaymentModalClosed] = useState(false);

  // 앱 시작 시점 기록 (사용 시간 체크용)
  useEffect(() => {
    // 앱 사용 시작 시간이 없으면 저장
    if (!localStorage.getItem('app_start_time')) {
      localStorage.setItem('app_start_time', Date.now().toString());
    }

    // 오프라인에서 저장된 설문 데이터가 있는지 확인하고 동기화 시도
    const syncData = async () => {
      await syncOfflineSurveyData();
    };

    // 네트워크 연결 상태 모니터링
    const handleOnline = () => {
      console.log('온라인 상태로 전환되었습니다. 오프라인 데이터 동기화 시도.');
      syncData();
    };

    // 네트워크 연결 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);

    // 초기 로드 시 한 번 확인
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // PaymentModal 닫힘 이벤트 감지 (custom event)
  useEffect(() => {
    const handlePaymentModalClosed = () => {
      console.log('결제 모달이 닫혔습니다. 10초 후 설문조사 표시 예정');
      setHasPaymentModalClosed(true);

      // 결제 모달 닫힘 시간 저장
      localStorage.setItem('payment_modal_closed_time', Date.now().toString());
    };

    // 이벤트 리스너 등록
    window.addEventListener('paymentModalClosed', handlePaymentModalClosed);

    return () => {
      // 이벤트 리스너 제거
      window.removeEventListener(
        'paymentModalClosed',
        handlePaymentModalClosed
      );
    };
  }, []);

  // PaymentModal이 닫히면 10초 후 설문조사 표시
  useEffect(() => {
    if (hasPaymentModalClosed && !showSurvey) {
      // 이미 설문조사에 응답했는지 확인
      const hasCompletedSurvey =
        localStorage.getItem('survey_completed') === 'true';

      if (!hasCompletedSurvey) {
        const timer = setTimeout(() => {
          setShowSurvey(true);
        }, 10000); // 10초

        return () => clearTimeout(timer);
      }
    }
  }, [hasPaymentModalClosed, showSurvey]);

  // 서비스 사용 5분 후 설문조사 표시
  useEffect(() => {
    const checkAppUsageTime = () => {
      const appStartTime = localStorage.getItem('app_start_time');

      if (appStartTime) {
        const startTime = parseInt(appStartTime, 10);
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // 5분(300,000ms) 이상 경과 && 설문조사 미참여
        const hasCompletedSurvey =
          localStorage.getItem('survey_completed') === 'true';

        if (elapsedTime >= 300000 && !hasCompletedSurvey && !showSurvey) {
          setShowSurvey(true);
        }
      }
    };

    // 1분마다 사용 시간 체크
    const intervalId = setInterval(checkAppUsageTime, 60000);

    return () => clearInterval(intervalId);
  }, [showSurvey]);

  const handleCloseSurvey = () => {
    setShowSurvey(false);
  };

  return (
    <>
      {children}
      <SurveyModal isOpen={showSurvey} onClose={handleCloseSurvey} />
    </>
  );
};

export default SurveyProvider;
