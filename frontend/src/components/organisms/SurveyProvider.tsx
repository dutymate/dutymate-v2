import { useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import SurveyModal from './SurveyModal';

// 설문 관련 상수 정의
const SURVEY_COOKIE_NAME = 'dutyMateSurveySubmitted';
const SURVEY_NEXT_SHOW_DATE = 'dutyMateSurveyNextShowDate';
const SURVEY_COOKIE_EXPIRY_DAYS = 7;
const SURVEY_BASE_DELAY_MS = 5 * 60 * 1000; // 5분 (기본값)

interface SurveyProviderProps {
  children: ReactNode;
}

/**
 * 설문조사를 특정 시점에 자동으로 표시하는 Provider 컴포넌트
 * - 쿠키를 활용하여 7일 이내에 설문을 제출했다면 모달을 표시하지 않음
 * - 로그인 상태인 경우 기본 5분 후 자동으로 표시
 * - X 버튼으로 닫을 경우 다음 날 로그인 시까지 표시하지 않음
 */
const SurveyProvider = ({ children }: SurveyProviderProps) => {
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // 사용자가 X 버튼을 눌러 닫을 때 호출되는 함수
  const handleCloseSurvey = () => {
    // 다음 날짜 설정 (오늘 날짜 + 1일)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // 다음 날 자정으로 설정

    // 다음 표시 날짜를 쿠키에 저장
    Cookies.set(SURVEY_NEXT_SHOW_DATE, tomorrow.toISOString(), {
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
      if (surveySubmittedCookie === 'true') return false; // 이미 제출했으면 표시 안함

      // 다음 표시 날짜 확인
      const nextShowDateStr = Cookies.get(SURVEY_NEXT_SHOW_DATE);
      if (nextShowDateStr) {
        const nextShowDate = new Date(nextShowDateStr);
        const now = new Date();
        // 현재 시간이 다음 표시 날짜보다 이전이면 표시하지 않음
        if (now < nextShowDate) return false;
      }

      return true; // 위 조건에 해당하지 않으면 표시 가능
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

      // 설문 표시 가능한 상태인지 확인
      if (checkSurveyEligibility()) {
        // 페이지 로드 후 5분 후에 설문 모달 표시
        const timer = setTimeout(() => {
          setShowSurveyModal(true);
        }, SURVEY_BASE_DELAY_MS);

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
