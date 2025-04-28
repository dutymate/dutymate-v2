# TIL

날짜 : 2025-04-28 (월)

 <br>

# js-cookie를 활용한 랜딩 페이지 업데이트 안내 모달 구현

## 1. 문제 상황

- 랜딩 페이지에 업데이트 안내 모달을 구현하고 싶었음
- 사용자가 "오늘 하루 보지 않기"를 클릭하면 24시간 동안 모달이 보이지 않아야 함
- 이를 위해 쿠키를 활용하여 상태를 저장하기로 결정

## 2. 구현 방법

#### 2.1 필요한 패키지 설치

```bash
npm install js-cookie
```

#### 2.2 쿠키 설정 및 조회

```typescript
import Cookies from 'js-cookie';

// 쿠키 설정 (24시간 후 만료)
Cookies.set('dutyMateNoticeHidden', 'true', { expires: 1 });

// 쿠키 조회
const isHiddenToday = Cookies.get('dutyMateNoticeHidden');
```

#### 2.3 실제 구현 코드

```typescript
const [showNoticeModal, setShowNoticeModal] = useState(false);

// 컴포넌트 마운트 시 쿠키 확인
useEffect(() => {
  const isHiddenToday = Cookies.get('dutyMateNoticeHidden');
  if (!isHiddenToday) {
    setShowNoticeModal(true);
  }
}, []);

// 모달 닫기
const handleCloseModal = () => {
  setShowNoticeModal(false);
};

// "오늘 하루 보지 않기" 클릭 시
const handleDoNotShowToday = () => {
  Cookies.set('dutyMateNoticeHidden', 'true', { expires: 1 });
  setShowNoticeModal(false);
};
```

## 3. 주요 특징

- `expires: 1` 옵션으로 24시간 후 자동 만료 설정
- 쿠키 이름을 `dutyMateNoticeHidden`으로 명확하게 지정
- 모달 표시 여부를 state로 관리하여 리렌더링 최적화

## 4. 장점

- 서버 없이 클라이언트에서 상태 관리 가능
- 브라우저를 닫아도 쿠키가 유지됨
- 만료 시간을 자동으로 관리할 수 있음
- 간단한 API로 쉽게 구현 가능

## 5. 주의사항

- 쿠키는 브라우저별로 저장되므로, 다른 브라우저에서는 다시 보임
- 사용자가 쿠키를 삭제하면 다시 모달이 표시됨
- 민감한 정보는 쿠키에 저장하지 않도록 주의
