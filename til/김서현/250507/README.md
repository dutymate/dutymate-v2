# Today I Learned

> 2025년 05월 07일

## React KakaoMap SDK

### 1. Kakao Developers에서 앱 키 발급
- [Kakao Developers](https://developers.kakao.com/)에 회원가입 및 로그인
- 내 애플리케이션 > 애플리케이션 추가 > 앱 키(자바스크립트 키) 확인

### 2. KakaoMap SDK 스크립트 추가
- public/index.html 파일의 `<head>` 태그 안에 아래 스크립트 추가
```html
<script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은_자바스크립트_키&autoload=false"></script>
```

### 3. React에서 KakaoMap 불러오기
- useEffect를 사용해 KakaoMap SDK를 로드하고, 지도를 생성

```jsx
import React, { useEffect } from 'react';

const KakaoMap = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은_자바스크립트_키&autoload=false";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 좌표
          level: 3
        };
        new window.kakao.maps.Map(container, options);
      });
    };
  }, []);

  return (
    <div id="map" style={{ width: "100%", height: "400px" }}></div>
  );
};

export default KakaoMap;
```

### 4. 참고 및 주의사항
- appkey는 노출되지 않도록 환경변수(.env)로 관리하는 것이 좋음
- KakaoMap 공식 문서: [카카오맵 JS API](https://apis.map.kakao.com/web/)
-(https://react-kakao-maps-sdk.jaeseokim.dev/)
-(https://developers.kakao.com/) > 로그인 > 내 애플리케이션 > 앱 권한 신청 > 카카오맵 > 신청 > 3-5일 가량 소요요

