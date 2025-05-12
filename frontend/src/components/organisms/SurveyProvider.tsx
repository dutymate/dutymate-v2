import { ReactNode } from 'react';

interface SurveyProviderProps {
  children: ReactNode;
}

/**
 * 설문조사를 특정 시점에 자동으로 표시하는 Provider 컴포넌트
 * - PaymentModal에서 벗어난 후 10초 후 팝업
 * - 서비스 사용 5분이 경과한 시점 (300초)
 *
 * 현재 테스트 기능으로 비활성화됨
 */
const SurveyProvider = ({ children }: SurveyProviderProps) => {
  return <>{children}</>;
};

export default SurveyProvider;
