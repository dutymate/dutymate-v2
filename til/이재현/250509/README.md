# Today I Learned

> 2025년 05월 09일 이재현

## Google Tag Manager(GTM)를 활용한 사용자 흐름 추적하기

### 1. 기존 GTM 태그 분석 (개별 클릭 트래킹)

현재 우리 프로젝트에서는 개별 버튼 클릭을 트래킹하는 GTM 태그가 구현되어 있다. `PaymentModal.tsx`의 구독 버튼 클릭 이벤트를 예로 들면:

```tsx
// GTM 이벤트 트래킹 (상세 매개변수 추가)
if (typeof window !== 'undefined' && 'dataLayer' in window) {
  // GA4에 최적화된 이벤트 구조
  window.dataLayer.push({
    event: 'button_click',
    event_category: 'subscription',
    event_action: 'click',
    event_label: `${planType}_subscription`,
    event_id: `subscribe_${planType}_${isMobile ? 'mobile' : 'desktop'}`,
    subscription_plan: planType,
    subscription_view: isMobile ? 'mobile' : 'desktop',
    subscription_duration:
      planType === 'monthly' ? '1' : planType === 'quarterly' ? '3' : '12',
  });
}
```

이 방식은 **개별 클릭**을 트래킹하는 데는 유용하지만, 한 사용자가 어떤 순서로 여러 페이지와 기능을 사용했는지 **흐름을 파악하기 어렵다**.

### 2. 사용자 여정(User Journey) 트래킹 구현 방법

#### 2.1 사용자 식별 정보 추가하기

사용자 흐름을 추적하려면 각 이벤트에 **고유한 사용자 식별자**와 **세션 ID**를 포함시켜야 한다.

```tsx
// 사용자 ID와 세션 ID 설정 (로그인 시 실행)
function setUserIdentification(userId) {
  // 세션 ID 생성 (이미 있으면 재사용)
  const sessionId =
    localStorage.getItem('gtm_session_id') ||
    `session_${new Date().getTime()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

  localStorage.setItem('gtm_session_id', sessionId);

  // GA4에 사용자 속성 설정
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-ZCF7VCE51W', {
      user_id: userId,
      session_id: sessionId,
    });
  }

  // GTM 데이터 레이어에도 사용자 정보 추가
  window.dataLayer.push({
    event: 'user_identified',
    user_id: userId,
    session_id: sessionId,
  });
}
```

#### 2.2 이벤트에 순서 정보 추가하기

각 이벤트에 **타임스탬프**와 **이벤트 순서 번호**를 추가한다:

```tsx
// 이벤트 카운터 초기화 (세션마다)
let eventCounter = parseInt(sessionStorage.getItem('gtm_event_counter') || '0');

// 사용자 액션 트래킹 함수
function trackUserAction(eventName, eventParams = {}) {
  // 이벤트 카운터 증가
  eventCounter++;
  sessionStorage.setItem('gtm_event_counter', eventCounter.toString());

  // 타임스탬프
  const timestamp = new Date().toISOString();

  // 세션 ID 가져오기
  const sessionId = localStorage.getItem('gtm_session_id');

  // 확장된 이벤트 데이터
  const enhancedEventData = {
    event: eventName,
    event_time: timestamp,
    event_index: eventCounter,
    session_id: sessionId,
    ...eventParams,
  };

  // GTM으로 이벤트 전송
  window.dataLayer.push(enhancedEventData);
}
```

#### 2.3 페이지 경로와 이전 페이지 추적

사용자의 이동 경로를 추적하기 위해 페이지 이동 시 이전 페이지 정보를 기록한다:

```tsx
// App.tsx나 라우터 설정에서 구현
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    // 이전 페이지 정보 가져오기
    const previousPage = sessionStorage.getItem('current_page') || null;
    // 현재 페이지 저장
    sessionStorage.setItem('current_page', location.pathname);

    // 페이지 전환 이벤트 트래킹
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: 'page_view',
        page_path: location.pathname,
        page_previous: previousPage,
        page_title: document.title,
        event_time: new Date().toISOString(),
        event_index: ++eventCounter,
      });

      sessionStorage.setItem('gtm_event_counter', eventCounter.toString());
    }
  }, [location]);

  return null;
}
```

### 3. 사용자 흐름 분석을 위한 코드 구현 예시

실제 프로젝트에 적용할 수 있는 사용자 흐름 트래킹 코드 예시:

```tsx
// src/utils/analytics.ts
interface UserActionParams {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

class AnalyticsService {
  private sessionId: string;
  private eventCounter: number;

  constructor() {
    // 세션 ID 생성 또는 가져오기
    this.sessionId =
      localStorage.getItem('gtm_session_id') ||
      `session_${new Date().getTime()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    localStorage.setItem('gtm_session_id', this.sessionId);

    // 이벤트 카운터 초기화
    this.eventCounter = parseInt(
      sessionStorage.getItem('gtm_event_counter') || '0'
    );
  }

  // 사용자 식별
  identifyUser(userId: string) {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-ZCF7VCE51W', {
        user_id: userId,
        session_id: this.sessionId,
      });
    }

    window.dataLayer.push({
      event: 'user_identified',
      user_id: userId,
      session_id: this.sessionId,
      event_time: new Date().toISOString(),
      event_index: ++this.eventCounter,
    });

    this.updateEventCounter();
  }

  // 사용자 액션 트래킹
  trackEvent(eventName: string, params: UserActionParams = {}) {
    const enhancedParams = {
      event: eventName,
      event_time: new Date().toISOString(),
      event_index: ++this.eventCounter,
      session_id: this.sessionId,
      ...params,
    };

    window.dataLayer.push(enhancedParams);
    this.updateEventCounter();
  }

  // 페이지 뷰 트래킹
  trackPageView(path: string, title: string) {
    const previousPage = sessionStorage.getItem('current_page') || null;
    sessionStorage.setItem('current_page', path);

    this.trackEvent('page_view', {
      page_path: path,
      page_previous: previousPage,
      page_title: title,
    });
  }

  // 사용자 흐름 시작 트래킹
  startUserFlow(flowName: string) {
    sessionStorage.setItem('current_flow', flowName);
    sessionStorage.setItem('flow_start_time', new Date().toISOString());
    sessionStorage.setItem('flow_step', '1');

    this.trackEvent('flow_start', {
      flow_name: flowName,
      flow_step: 1,
    });
  }

  // 사용자 흐름 단계 트래킹
  trackFlowStep(stepName: string) {
    const flowName = sessionStorage.getItem('current_flow');
    const currentStep = parseInt(sessionStorage.getItem('flow_step') || '1');
    const nextStep = currentStep + 1;

    sessionStorage.setItem('flow_step', nextStep.toString());

    this.trackEvent('flow_step', {
      flow_name: flowName,
      flow_step: nextStep,
      step_name: stepName,
    });
  }

  // 사용자 흐름 완료 트래킹
  completeUserFlow(success: boolean = true) {
    const flowName = sessionStorage.getItem('current_flow');
    const startTime = sessionStorage.getItem('flow_start_time');
    const currentStep = parseInt(sessionStorage.getItem('flow_step') || '1');

    // 흐름 완료 시간 계산
    let flowDuration = 0;
    if (startTime) {
      const start = new Date(startTime).getTime();
      const end = new Date().getTime();
      flowDuration = Math.round((end - start) / 1000); // 초 단위
    }

    this.trackEvent(success ? 'flow_complete' : 'flow_abandon', {
      flow_name: flowName,
      flow_duration_seconds: flowDuration,
      flow_steps_taken: currentStep,
    });

    // 흐름 데이터 초기화
    sessionStorage.removeItem('current_flow');
    sessionStorage.removeItem('flow_start_time');
    sessionStorage.removeItem('flow_step');
  }

  private updateEventCounter() {
    sessionStorage.setItem('gtm_event_counter', this.eventCounter.toString());
  }
}

export const analytics = new AnalyticsService();
```

### 4. 실제 적용 예시: 회원가입 흐름 추적

예를 들어, 부가정보 입력 단계가 포함된 회원가입 과정을 추적하는 코드는 다음과 같다:

```tsx
// 회원가입 페이지 컴포넌트
import { useEffect } from 'react';
import { analytics } from '@/utils/analytics';

const SignupPage = () => {
  useEffect(() => {
    // 회원가입 흐름 시작 기록
    analytics.startUserFlow('signup_flow');
  }, []);

  const handleSubmit = async (data) => {
    try {
      // 회원가입 API 호출
      const response = await userService.signup(data);

      // 회원가입 단계 완료 기록
      analytics.trackFlowStep('signup_form_submit');

      // 부가정보 페이지로 이동
      navigate('/extra-info');
    } catch (error) {
      // 오류 발생 시 실패 이벤트 기록
      analytics.trackEvent('signup_error', {
        error_message: error.message
      });
    }
  };

  return (
    // 회원가입 폼 렌더링
  );
};

// 부가정보 페이지 컴포넌트
const ExtraInfo = () => {
  useEffect(() => {
    // 부가정보 페이지 방문 기록
    analytics.trackFlowStep('extra_info_page_view');
  }, []);

  const handleSubmit = async (data) => {
    try {
      // 부가정보 제출 API 호출
      await userService.submitAdditionalInfo(data);

      // 회원가입 흐름 완료 기록
      analytics.completeUserFlow(true);

      // 다음 페이지로 이동
      if (data.role === 'HN') {
        navigate('/create-ward');
      } else {
        navigate('/enter-ward');
      }
    } catch (error) {
      // 회원가입 흐름 실패 기록
      analytics.completeUserFlow(false);
    }
  };

  return (
    // 부가정보 입력 폼 렌더링
  );
};
```

### 5. GTM 설정 및 데이터 분석 방법

1. **GTM에서 변수 설정**:

   - 사용자 ID, 세션 ID, 이벤트 인덱스, 흐름 이름 등의 변수 설정

2. **사용자 정의 트리거 생성**:

   - 흐름 시작, 단계, 완료 등의 이벤트를 위한 트리거 생성

3. **태그 설정**:

   - GA4로 강화된 이벤트 데이터 전송을 위한 태그 설정

4. **GA4에서 사용자 흐름 분석**:

   - 탐색 → 사용자 정의 → 새 탐색
   - 세션 ID별 이벤트 시퀀스 분석
   - 단계별 전환율 및 이탈률 확인

5. **BigQuery 연동 (고급)**:
   - GA4 데이터를 BigQuery로 내보내기
   - SQL 쿼리로 복잡한 사용자 경로 분석

### 6. 결론

개별 클릭 이벤트 추적에서 한 단계 더 나아가 사용자 흐름을 추적함으로써 다음과 같은 이점을 얻을 수 있다:

1. 사용자가 어떤 경로로 서비스를 이용하는지 파악
2. 단계별 이탈률 식별 및 문제점 개선
3. 핵심 전환 경로 최적화
4. 사용자 경험 개선을 위한 인사이트 획득

현재 구현된 개별 클릭 이벤트는 유용하지만, 사용자 흐름 추적을 위해서는 세션 ID, 이벤트 순서, 흐름 단계 등의 추가 정보가 필요하다. 이를 통해 더 정확하고 가치 있는 분석이 가능해질 것이다.
