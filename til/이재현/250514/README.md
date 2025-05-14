# Today I Learned

> 2025년 05월 14일 이재현

## 카카오톡 인앱 브라우저 회피 기능 구현

### 배경

- 카카오톡 인앱 브라우저에서 발생하는 문제점
  - 로그인 및 인증 기능 오류
  - 파일 다운로드 기능 제한
  - 일부 웹 API 호환성 문제
- 사용자 경험 개선을 위한 외부 브라우저 사용 유도 필요

### 구현 내용

1. 인앱 브라우저 감지 함수 구현

   ```javascript
   function isKakaoTalkInAppBrowser() {
     const userAgent = navigator.userAgent.toLowerCase();
     return userAgent.includes('kakaotalk');
   }
   ```

   - User-Agent 문자열 분석을 통한 카카오톡 브라우저 감지
   - toLowerCase()를 통한 대소문자 구분 없이 검색

2. 외부 브라우저 리다이렉트 처리
   ```javascript
   if (isKakaoTalkInAppBrowser()) {
     const target_url = window.location.href;
     location.href =
       'kakaotalk://web/openExternal?url=' + encodeURIComponent(target_url);
   }
   ```
   - kakaotalk://web/openExternal 스킴 활용
   - 현재 URL을 유지한 채 외부 브라우저로 전환
   - encodeURIComponent를 통한 URL 안전한 인코딩
