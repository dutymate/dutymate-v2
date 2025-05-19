/**
 * 로그인 페이지로 이동하는 함수
 * 환경에 따라 모바일앱은 네이티브 로그인 화면으로, 웹은 /login 경로로 이동
 */
export const navigateToLogin = () => {
  // 모바일 앱 환경인 경우 네이티브 로그인 화면으로 이동
  if (window.isMobileApp) {
    window.mobileApp?.postMessage({
      type: 'NAVIGATION',
      path: 'Login',
    });
  } else {
    // 웹 환경에서는 로그인 페이지로 이동
    window.location.href = '/login';
  }
};

/**
 * 랜딩 페이지로 이동하는 함수
 * 환경에 따라 모바일앱은 네이티브 랜딩 화면으로, 웹은 루트 경로로 이동
 */
export const navigateToLanding = () => {
  // 모바일 앱 환경인 경우 네이티브 랜딩 화면으로 이동
  if (window.isMobileApp) {
    window.mobileApp?.postMessage({
      type: 'NAVIGATION',
      path: 'Landing',
    });
  } else {
    // 웹 환경에서는 루트 페이지로 이동
    window.location.href = '/';
  }
};

/**
 * 병동 생성 페이지로 이동하는 함수
 */
export const navigateToCreateWard = () => {
  if (window.isMobileApp) {
    window.mobileApp?.postMessage({
      type: 'NAVIGATION',
      path: 'CreateWard',
    });
  } else {
    window.location.href = '/create-ward';
  }
};

/**
 * 추가 정보 입력 페이지로 이동하는 함수
 */
export const navigateToExtraInfo = () => {
  if (window.isMobileApp) {
    window.mobileApp?.postMessage({
      type: 'NAVIGATION',
      path: 'ExtraInfo',
    });
  } else {
    window.location.href = '/extra-info';
  }
};

/**
 * WebView 페이지로 이동하는 함수
 */
export const navigateToWebView = (path: string) => {
  if (window.isMobileApp) {
    window.mobileApp?.postMessage({
      type: 'NAVIGATION',
      path: 'WebView',
      params: { path },
    });
  } else {
    window.location.href = path;
  }
};
