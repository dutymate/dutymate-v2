/**
 * 모바일 앱 WebView와의 통신을 돕는 유틸리티
 */

import useUserAuthStore from '@/stores/userAuthStore';

// 모바일 앱에서 실행 중인지 여부를 확인
export const isMobileApp = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (window.isMobileApp === true ||
      localStorage.getItem('isMobileApp') === 'true')
  );
};

// 이벤트 리스너 타입 정의
type AuthDataEventListener = (data: any) => void;
type MobileAppNavigationListener = (path: string) => void;

// 이벤트 리스너 배열
const authDataListeners: AuthDataEventListener[] = [];
const navigationListeners: MobileAppNavigationListener[] = [];

/**
 * 모바일 앱 WebView와 통신하는 클래스
 */
class MobileAppBridge {
  private initialized = false;

  /**
   * 모바일 앱 브릿지 초기화
   * 앱이 로드될 때 자동으로 실행될 이벤트 리스너 등록
   */
  initialize(): void {
    if (this.initialized || !isMobileApp()) return;

    console.log('모바일 앱 브릿지 초기화...');

    // 모바일 앱 로드 이벤트 리스너 등록
    window.addEventListener('mobileAppLoaded', this.handleMobileAppLoaded);

    // 메시지 이벤트 리스너 등록
    window.addEventListener('message', this.handleMessageFromMobileApp);

    // 초기화 완료 표시
    this.initialized = true;
    console.log('모바일 앱 브릿지 초기화 완료');
  }

  /**
   * 모바일 앱 로드 이벤트 핸들러
   */
  private handleMobileAppLoaded = (event: Event): void => {
    console.log('모바일 앱 로드 이벤트 수신:', event);

    // 인증 데이터 요청
    this.requestAuthData();
  };

  /**
   * 모바일 앱으로부터 수신된 메시지 처리
   */
  private handleMessageFromMobileApp = (event: MessageEvent): void => {
    console.log('모바일 앱으로부터 메시지 수신:', event);

    try {
      // 데이터가 문자열인 경우 파싱
      const data =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      // 메시지 타입에 따라 처리
      switch (data.type) {
        case 'AUTH_DATA':
          this.handleAuthData(data);
          break;

        default:
          console.log('처리되지 않은 메시지 타입:', data.type);
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  };

  /**
   * 인증 데이터 처리
   */
  private handleAuthData(data: any): void {
    console.log('인증 데이터 수신:', data);

    if (data.authToken && data.userInfo) {
      // 세션 스토리지에 인증 데이터 저장
      const authData = {
        state: {
          isAuthenticated: true,
          userInfo: {
            ...data.userInfo,
            token: data.authToken,
          },
          additionalInfo: null,
          isTimeout: false,
          timeLeft: 0,
        },
        version: 0,
      };

      sessionStorage.setItem('user-auth-storage', JSON.stringify(authData));

      // 사용자 정보 설정
      try {
        const setUserInfo = useUserAuthStore.getState().setUserInfo;
        setUserInfo({
          ...data.userInfo,
          token: data.authToken,
        });
      } catch (error) {
        console.error('사용자 정보 설정 오류:', error);
      }

      // 리스너 호출
      authDataListeners.forEach((listener) => listener(data));
    }
  }

  /**
   * 인증 데이터 요청
   * 모바일 앱으로 인증 정보 요청 메시지 전송
   */
  requestAuthData(): void {
    if (!isMobileApp() || !window.mobileApp) return;

    console.log('모바일 앱에 인증 데이터 요청');
    window.mobileApp.requestAuthData();
  }

  /**
   * 모바일 앱 네비게이션 요청
   * @param path 이동할 경로
   */
  navigate(path: string): void {
    if (!isMobileApp() || !window.mobileApp) return;

    console.log(`모바일 앱 네비게이션 요청: ${path}`);
    window.mobileApp.navigate(path);

    // 리스너 호출
    navigationListeners.forEach((listener) => listener(path));
  }

  /**
   * 토스트 메시지 표시 요청
   * @param message 표시할 메시지
   * @param description 추가 설명
   * @param type 메시지 타입 (info, success, error, warning)
   */
  showToast(
    message: string,
    description?: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ): void {
    if (!isMobileApp() || !window.mobileApp) return;

    window.mobileApp.showToast(message, description, type);
  }

  /**
   * 인증 데이터 수신 리스너 등록
   * @param listener 리스너 함수
   */
  onAuthData(listener: AuthDataEventListener): () => void {
    authDataListeners.push(listener);
    return () => {
      const index = authDataListeners.indexOf(listener);
      if (index > -1) {
        authDataListeners.splice(index, 1);
      }
    };
  }

  /**
   * 네비게이션 리스너 등록
   * @param listener 리스너 함수
   */
  onNavigation(listener: MobileAppNavigationListener): () => void {
    navigationListeners.push(listener);
    return () => {
      const index = navigationListeners.indexOf(listener);
      if (index > -1) {
        navigationListeners.splice(index, 1);
      }
    };
  }
}

// 전역 타입 확장
declare global {
  interface Window {
    isMobileApp?: boolean;
    mobileApp?: {
      postMessage: (message: any) => void;
      requestAuthData: () => void;
      navigate: (path: string) => void;
      showToast: (message: string, description?: string, type?: string) => void;
    };
  }
}

// 싱글톤 인스턴스 생성
const mobileAppBridge = new MobileAppBridge();

// 자동 초기화 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  mobileAppBridge.initialize();
}

export default mobileAppBridge;
