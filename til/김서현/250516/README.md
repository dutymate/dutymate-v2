# Today I Learned

> 2025년 05월 16일 

### `Tailwind CSS`에서 자주 사용하는 레이아웃 관련 클래스인 `h-full`, `h-screen`, `flex-1`, 그리고 부모 컨테이너의 역할

---

## 용어 간단 정리

| 클래스명       | 의미              | 설명                                                                   |
| ---------- | --------------- | -------------------------------------------------------------------- |
| `h-full`   | **부모 높이만큼 차지**  | 부모 컨테이너의 높이가 지정되어 있어야 작동합니다.                                         |
| `h-screen` | **화면 전체 높이**    | 뷰포트 기준으로 100vh, 즉 브라우저 화면 전체 높이를 차지합니다.                              |
| `flex-1`   | **남은 공간 모두 차지** | 부모가 `flex`이고, 다른 형제 요소들과 비율 기반으로 공간을 나눕니다. 주로 `flex` 레이아웃 안에서 사용합니다. |

---

## 부모 컨테이너의 역할

Tailwind의 `h-full`, `flex-1` 등은 **부모의 컨텍스트**가 매우 중요합니다. 예를 들어:

```tsx
<div className="h-screen flex">
  <div className="w-64 bg-gray-200">사이드바</div>
  <div className="flex-1 bg-white">메인 콘텐츠</div>
</div>
```

* 이 경우 `flex-1`은 남은 공간 전체를 차지하게 되고, `h-screen` 덕분에 전체 화면 높이를 기준으로 잡습니다.

---

## 실제 프로젝트 적용 예시

`MyShift.tsx` 파일 안에서 아래와 같이 `flex-1`, `h-screen` 등을 적절히 활용하고 있습니다:

```tsx
<div className="w-full h-screen flex flex-row bg-[#F4F4F4]">
  {/* Sidebar */}
  <div className="hidden lg:block w-[14.875rem] shrink-0">
    <Sidebar ... />
  </div>

  {/* 메인 컨텐츠 영역 */}
  <div className="flex-1 min-w-0 px-0 py-0 lg:px-8 lg:py-6 h-screen overflow-y-auto">
    ...
  </div>
</div>
```

🔍 여기서 중요한 포인트:

* `부모 div`가 `h-screen`이므로 자식들이 전체 화면 기준으로 정렬됩니다.
* `flex` 레이아웃이므로 사이드바 + 본문 영역이 가로로 배치됩니다.
* `flex-1`은 **남은 공간을 전부 차지**하므로, 사이드바를 제외한 나머지 너비를 메인 콘텐츠가 가져갑니다.

---

## 강제로 `flex-1` 효과를 줘야 할 때

가끔 부모가 `flex`가 아니거나, 다른 자식들과 공간을 나눠야 할 때 명시적으로 `flex-1`을 강제로 줘야 할 수 있습니다. 예를 들어:

```tsx
<div className="h-screen flex flex-col">
  <header className="h-16 bg-gray-300">헤더</header>
  <main className="flex-1 overflow-auto bg-white">스크롤 가능한 메인</main>
  <footer className="h-12 bg-gray-300">푸터</footer>
</div>
```

* `flex-col`이기 때문에 세로 방향으로 쌓이고,
* 가운데 `main`이 `flex-1`이 되면, 헤더/푸터 외의 남은 높이를 전부 차지합니다.

---

## 요약

| 목적            | Tailwind 클래스 | 전제 조건          |
| ------------- | ------------ | -------------- |
| 전체 화면 높이 사용   | `h-screen`   | 브라우저 전체 기준     |
| 부모 높이만큼 사용    | `h-full`     | 부모에 높이 지정 필요   |
| flex 남은 공간 채움 | `flex-1`     | 부모가 `flex`여야 함 |

---



