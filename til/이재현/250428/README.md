# Today I Learned

> 2025년 04월 28일 이재현

## Google Analytics 4(GA4)와 Google Tag Manager(GTM) 개요

### GA4와 GTM의 특징과 차이점

#### Google Analytics 4 (GA4)
- **정의**: 구글이 제공하는 최신 웹 분석 도구로, 이벤트 기반 데이터 모델을 사용합니다.
- **주요 특징**:
  - 이벤트 기반 데이터 수집
  - 머신러닝을 활용한 예측 분석
  - 개인정보 보호 강화
  - 크로스 플랫폼 추적 (웹, 앱)
  - 실시간 데이터 분석
- **장점**:
  - 더 정확한 사용자 행동 분석
  - 개인정보 보호 규정 준수
  - 향상된 데이터 시각화
  - 무료로 사용 가능한 강력한 기능

#### Google Tag Manager (GTM)
- **정의**: 웹사이트의 태그(스크립트)를 관리하는 도구로, 코드 수정 없이 태그를 추가/수정할 수 있습니다.
- **주요 특징**:
  - 코드 수정 없이 태그 관리
  - 버전 관리 및 롤백 기능
  - 사용자 권한 관리
  - 태그 템플릿 제공
  - 이벤트 트리거링 기능
- **장점**:
  - 개발자 의존도 감소
  - 빠른 태그 배포
  - 오류 발생 가능성 감소
  - 다양한 통합 기능

#### GA4와 GTM의 차이점
- **목적**: GA4는 데이터 분석 도구이고, GTM은 태그 관리 도구입니다.
- **기능**: GA4는 데이터 수집과 분석에 중점을 두고, GTM은 태그 관리와 배포에 중점을 둡니다.
- **사용 방식**: GA4는 직접 코드를 삽입하거나 GTM을 통해 사용할 수 있지만, GTM은 다양한 마케팅 및 분석 태그를 관리하는 플랫폼입니다.
- **통합**: GTM을 통해 GA4를 설치하면 더 유연한 이벤트 추적이 가능합니다.

### 기본적인 사용 방법

#### GA4 기본 설정
1. **계정 및 속성 생성**
   - Google Analytics 계정 생성
   - 속성(Property) 생성
   - 데이터 스트림 설정 (웹, 앱, 등)

2. **측정 ID 확인**
   - Admin → Data Streams → 웹 스트림 선택
   - Measurement ID 확인 (G-로 시작)

3. **코드 설치**
   - 직접 설치: 측정 ID를 포함한 gtag.js 코드를 웹사이트에 삽입
   - GTM을 통한 설치: GTM에 GA4 태그 생성 후 배포

#### GTM 기본 설정
1. **컨테이너 생성**
   - GTM 계정 생성
   - 웹사이트용 컨테이너 생성
   - 컨테이너 ID 확인 (GTM-으로 시작)

2. **코드 설치**
   - GTM 코드를 웹사이트의 `<head>` 태그 내에 삽입
   - noscript 코드를 `<body>` 태그 시작 부분에 삽입

3. **태그, 트리거, 변수 설정**
   - 태그: 실행할 코드 정의
   - 트리거: 태그 실행 조건 정의
   - 변수: 동적 데이터 저장 및 참조

### index.html에 추가한 GTM 및 GA4 코드 설명

```html
<!-- Google Tag Manager (GTM) 설정 -->
<!-- GTM은 웹사이트의 태그를 관리하는 도구입니다. 
     이 스크립트는 GTM을 웹사이트에 설치하는 코드입니다.
     GTM-M9XTN3B3는 여러분의 GTM 컨테이너 ID입니다. -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-M9XTN3B3');
</script>
<!-- End Google Tag Manager -->

<!-- Google Analytics 4 (GA4) 설정 -->
<!-- GA4는 구글의 웹 분석 도구입니다. 
     이 스크립트는 GA4를 웹사이트에 설치하는 코드입니다.
     G-ZCF7VCE51W는 여러분의 GA4 측정 ID입니다. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZCF7VCE51W"></script>
<script>
  // dataLayer는 GTM과 GA4가 데이터를 주고받는 공간입니다.
  window.dataLayer = window.dataLayer || [];
  // gtag 함수는 GA4에 이벤트를 전송하는 함수입니다.
  function gtag(){dataLayer.push(arguments);}
  // GA4 초기화
  gtag('js', new Date());
  // GA4 설정 (측정 ID 설정)
  gtag('config', 'G-ZCF7VCE51W');
</script>
```

```html
<!-- Google Tag Manager (noscript) -->
<!-- 이 부분은 JavaScript가 비활성화된 브라우저에서도 GTM이 작동할 수 있도록 하는 백업 코드입니다. -->
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M9XTN3B3"
          height="0" width="0" style="display:none;visibility:hidden">
  </iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->
```

## GTM을 활용한 버튼 클릭 이벤트 트래킹 구현

### 1. 기본 설정
1. **GTM 변수 활성화**
   - GTM 관리자 페이지 → Variables → Built-in Variables
   - Configure 버튼 클릭
   - Click 관련 변수들 모두 활성화
     - Click Classes
     - Click Target
     - Click Text
     - Click URL

   **예시**: 
   ```html
   <!-- HTML 버튼 예시 -->
   <button id="signup-button" class="btn-primary" onclick="signUp()">회원가입</button>
   ```
   위 버튼이 클릭되면 GTM은 다음 변수를 자동으로 인식합니다:
   - Click ID = "signup-button"
   - Click Classes = "btn-primary"
   - Click Text = "회원가입"
   
   이러한 변수들을 활성화하면 어떤 버튼이 클릭되었는지 정확히 식별할 수 있습니다.

### 2. 링크 버튼 트래킹 설정
1. **트리거 생성**
   - Triggers → New → Trigger Configuration
   - "Just Links" 선택
   - 이름: "All Link Clicks"
   - 저장

2. **태그 생성**
   - Tags → New → Tag Configuration
   - "Google Analytics: GA4 Event" 선택
   - 설정:
     - Measurement ID: GA4 측정 ID 입력
     - Event Name: "button_click"
     - Event Parameters 추가:
       - link_text: {{Click Text}}
       - link_url: {{Click URL}}
       - link_id: {{Click ID}}

3. **트리거 연결**
   - 특정 버튼만 트래킹하려면:
     - 트리거 편집 → Some Links
     - Click ID equals "버튼ID"
     - 저장

   **예시**:
   ```html
   <!-- 링크 형태의 버튼 예시 -->
   <a href="/download" id="download-link" class="btn-download">파일 다운로드</a>
   ```
   
   **트리거 설정 예시**:
   1. Triggers → New → Just Links
   2. 트리거 이름: "Download Button Click"
   3. "Some Links" 선택
   4. 조건: Click ID equals "download-link"
   
   **태그 설정 예시**:
   1. Tags → New → Google Analytics: GA4 Event
   2. 태그 이름: "GA4 - Download Button Click"
   3. Measurement ID: G-ZCF7VCE51W
   4. Event Name: "download_click"
   5. Event Parameters:
      - action: "download"
      - file_type: "pdf" (또는 동적 변수 사용)
      - link_id: {{Click ID}}
   6. 트리거: "Download Button Click"
   
   이렇게 설정하면 파일 다운로드 링크가 클릭될 때만 GA4에 이벤트가 전송됩니다.

### 3. 일반 버튼 트래킹 설정
1. **트리거 생성**
   - Triggers → New → Trigger Configuration
   - "All Elements" 선택
   - 이름: "All Element Clicks"
   - 저장

2. **태그 생성**
   - Tags → New → Tag Configuration
   - "Google Analytics: GA4 Event" 선택
   - 설정:
     - Measurement ID: GA4 측정 ID 입력
     - Event Name: "button_click"
     - Event Parameters 추가:
       - button_text: {{Click Text}}
       - button_id: {{Click ID}}

3. **트리거 연결**
   - 특정 버튼만 트래킹하려면:
     - 트리거 편집 → Some Clicks
     - Click ID equals "버튼ID"
     - 저장

   **예시**:
   ```html
   <!-- 일반 버튼 예시 -->
   <button id="submit-form" class="btn-submit" type="submit">양식 제출</button>
   ```
   
   **트리거 설정 예시**:
   1. Triggers → New → All Elements
   2. 트리거 이름: "Form Submit Button Click"
   3. "Some Clicks" 선택
   4. 조건: Click ID equals "submit-form"
   
   **태그 설정 예시**:
   1. Tags → New → Google Analytics: GA4 Event
   2. 태그 이름: "GA4 - Form Submit Click"
   3. Measurement ID: G-ZCF7VCE51W
   4. Event Name: "form_submit"
   5. Event Parameters:
      - form_name: "contact" (또는 동적 변수 사용)
      - button_id: {{Click ID}}
      - button_text: {{Click Text}}
   6. 트리거: "Form Submit Button Click"
   
   이 설정은 양식 제출 버튼이 클릭될 때 GA4로 이벤트를 전송합니다. 실제 양식 제출 성공 여부는 추가 설정이 필요합니다.

### 4. 테스트 방법
1. **Preview 모드 사용**
   - GTM → Preview
   - 웹사이트 URL 입력
   - Connect 클릭
   - 버튼 클릭 테스트
   - 이벤트 발생 확인

2. **GA4 Debug View 확인**
   - GA4 → Admin → Debug View
   - 이벤트 발생 확인
   - 파라미터 값 확인

### 5. 데이터 확인
1. **GA4 리포트 생성**
   - Explore → Blank
   - Dimensions:
     - Event name
     - Link text (또는 Button text)
   - Metrics:
     - Event count
   - Filter:
     - Event name equals "button_click"

### 주의사항
1. 데이터 수집까지 24-48시간 소요
2. 트리거 설정 시 정확한 필터링 필수
3. Preview 모드에서 충분한 테스트 필요
4. GA4 Debug View로 실시간 확인 가능

### 참고 자료
- [GTM 설정 참고 영상](https://youtu.be/mTrEU03wtv8?feature=shared)

