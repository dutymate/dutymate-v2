import { useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import SurveyModal from './SurveyModal';

// 설문 관련 상수 정의
const SURVEY_COOKIE_NAME = 'dutyMateSurveySubmitted';
const SURVEY_DISMISS_COUNT = 'dutyMateSurveyDismissCount';
const SURVEY_COOKIE_EXPIRY_DAYS = 7;
const SURVEY_BASE_DELAY_MS = 5 * 60 * 1000; // 5분 (기본값)

interface SurveyProviderProps {
  children: ReactNode;
}

/**
 * 설문조사를 특정 시점에 자동으로 표시하는 Provider 컴포넌트
 * - 쿠키를 활용하여 7일 이내에 설문을 제출했다면 모달을 표시하지 않음
 * - 로그인 상태인 경우 기본 5분 후 자동으로 표시
 * - X 버튼으로 닫을 때마다 다음 표시 시간이 지수적으로 증가 (x2)
 */
const SurveyProvider = ({ children }: SurveyProviderProps) => {
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // 사용자가 X 버튼을 눌러 닫을 때 호출되는 함수
  const handleCloseSurvey = () => {
    // 현재 무시 횟수를 가져오기
    const currentDismissCount = parseInt(
      Cookies.get(SURVEY_DISMISS_COUNT) || '0',
      10
    );

    // 무시 횟수 증가 및 쿠키에 저장
    const newDismissCount = currentDismissCount + 1;
    Cookies.set(SURVEY_DISMISS_COUNT, newDismissCount.toString(), {
      expires: SURVEY_COOKIE_EXPIRY_DAYS,
    });

    // 모달 닫기
    setShowSurveyModal(false);
  };

  useEffect(() => {
    // 설문 조사 모달 표시 여부를 결정하는 로직
    const checkSurveyEligibility = () => {
      // 쿠키 확인 - 설문 제출 여부
      const surveySubmittedCookie = Cookies.get(SURVEY_COOKIE_NAME);
      return surveySubmittedCookie !== 'true'; // true가 아니면 설문 표시 가능
    };

    // 현재 무시 횟수에 따른 딜레이 시간 계산
    const calculateDelayTime = () => {
      const dismissCount = parseInt(
        Cookies.get(SURVEY_DISMISS_COUNT) || '0',
        10
      );
      // 무시 횟수에 따라 지수적으로 딜레이 증가 (2의 제곱)
      return SURVEY_BASE_DELAY_MS * Math.pow(2, dismissCount);
    };

    // 로그인 상태일 때만 설문 표시
    const isLoggedIn = sessionStorage.getItem('user-auth-storage') !== null;

    if (isLoggedIn) {
      // 로그인 상태일 때 쿠키가 없으면 초기값으로 설정
      if (Cookies.get(SURVEY_COOKIE_NAME) === undefined) {
        Cookies.set(SURVEY_COOKIE_NAME, 'false', {
          expires: SURVEY_COOKIE_EXPIRY_DAYS,
        });
      }

      // 무시 횟수 쿠키가 없으면 초기화
      if (Cookies.get(SURVEY_DISMISS_COUNT) === undefined) {
        Cookies.set(SURVEY_DISMISS_COUNT, '0', {
          expires: SURVEY_COOKIE_EXPIRY_DAYS,
        });
      }

      // 설문 표시 가능한 상태인지 확인
      if (checkSurveyEligibility()) {
        // 무시 횟수에 따른 딜레이 계산
        const delayTimeMs = calculateDelayTime();

        // 페이지 로드 후 계산된 시간 후에 설문 모달 표시
        const timer = setTimeout(() => {
          setShowSurveyModal(true);
        }, delayTimeMs);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <>
      {children}
      <SurveyModal isOpen={showSurveyModal} onClose={handleCloseSurvey} />
    </>
  );
};

export default SurveyProvider;
