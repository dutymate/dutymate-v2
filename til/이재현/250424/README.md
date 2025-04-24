# Today I Learned

> 2025년 04월 24일 이재현

# React Hooks, Queries, Mutations 완전 정복 가이드

---

## 1. React Hooks란?

**정의**

React에서 함수형 컴포넌트에서 상태 관리, 라이프사이클, side-effect 등을 사용할 수 있도록 만든 **함수들**이다.

**대표적인 기본 Hook**

| Hook | 설명 |
| --- | --- |
| `useState` | 컴포넌트 내부의 상태를 관리 |
| `useEffect` | 컴포넌트가 마운트되거나 상태가 변경될 때 side-effect 처리 |
| `useRef` | DOM 요소나 값 참조 |
| `useCallback`, `useMemo` | 성능 최적화용 |

**왜 쓰나요?**

- 클래스 컴포넌트 없이도 상태, 로직, 라이프사이클을 제어 가능
- **로직 재사용** (ex. 커스텀 훅을 만들어 여러 컴포넌트에서 사용)

---

## 2. `hooks/queries` 와 `hooks/mutations` 의 역할

React Query를 기반으로 **데이터 요청/변경**을 다음처럼 나누어 사용한다:

### `hooks/queries/`

- **서버에서 데이터를 "가져오는" 역할**
- 예: 사용자 정보 조회(GET), 리스트 불러오기, 상세 정보 보기 등

### `hooks/mutations/`

- **서버에 데이터를 "변경/보내는" 역할**
- 예: 생성(POST), 수정(PUT), 삭제(DELETE) 요청 등

둘 다 `@tanstack/react-query`의 `useQuery`, `useMutation`을 사용한다.

---

**폴더 구조 예시**

```
src/
├── hooks/
│   ├── queries/
│   │   └── useWhiskeyQueries.ts   // 데이터 조회 훅
│   └── mutations/
│       └── useWhiskeyMutation.ts    // 데이터 추가 훅
├── libs/
│   └── api/
│       └── whiskey.ts          // Axios 함수 정의

```

---

## 3. API 호출 (libs/api/whiskey.ts)

```tsx
// libs/api/whiskey.ts
import axios from 'axios';
import { Whiskey } from '@/types';

const API_BASE = 'https://api.example.com';

export const getWhiskeyList = async (): Promise<Whiskey[]> => {
  const response = await axios.get(`${API_BASE}/whiskeys`);
  return response.data;
};

export const addWhiskey = async (data: Partial<Whiskey>) => {
  const response = await axios.post(`${API_BASE}/whiskeys`, data);
  return response.data;
};

```

---

## 4. Queries 예시 (hooks/queries/useWhiskeyQueries.ts)

```json
// hooks/queries/useWhiskeyQueries.ts

import { useQuery } from '@tanstack/react-query';
import { getWhiskeyList, getWhiskeyById } from '@/libs/api/whiskey';

export const useWhiskeyList = () => {
  return useQuery(['whiskeyList'], getWhiskeyList);
};

export const useWhiskeyById = (id: string) => {
  return useQuery(['whiskey', id], () => getWhiskeyById(id), {
    enabled: !!id, // id가 있을 때만 fetch
  });
};
```

**사용법 (컴포넌트에서)**

```tsx
const WhiskeyPage = () => {
  const { data, isLoading, error } = useWhiskeyList();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error occurred</div>;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

```

---

## 5. Mutations 예시 (hooks/mutations/useWhiskeyMutations.ts)

```tsx

// hooks/mutations/useWhiskeyMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWhiskey, updateWhiskey, deleteWhiskey } from '@/libs/api/whiskey';

export const useAddWhiskey = () => {
  const queryClient = useQueryClient();

  return useMutation(addWhiskey, {
    onSuccess: () => {
      queryClient.invalidateQueries(['whiskeyList']);
    },
  });
};

export const useUpdateWhiskey = () => {
  const queryClient = useQueryClient();

  return useMutation(updateWhiskey, {
    onSuccess: () => {
      queryClient.invalidateQueries(['whiskeyList']);
    },
  });
};

export const useDeleteWhiskey = () => {
  const queryClient = useQueryClient();

  return useMutation(deleteWhiskey, {
    onSuccess: () => {
      queryClient.invalidateQueries(['whiskeyList']);
    },
  });
};

```

**사용법 (컴포넌트에서)**

```tsx
const AddWhiskeyForm = () => {
  const { mutate, isPending } = useAddWhiskey();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name: '맥켈란 12년', origin: 'Scotland' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isPending}>
        {isPending ? '추가 중...' : '위스키 추가'}
      </button>
    </form>
  );
};

```

---

# Axios 만으로도 충분히 API 요청을 할 수 있는데, 굳이 @tanstack/react-query (이하 **React Query**)를 쓰는 이유는?

## 1. axios만 사용할 때의 한계

예: 게시글 목록 불러오기

```tsx
useEffect(() => {
  axios.get('/posts')
    .then(res => setPosts(res.data))
    .catch(err => setError(err));
}, []);

```

이 코드도 문제는 없지만, 다음과 같은 불편함이 있다:

| 문제 | 설명 |
| --- | --- |
| 매번 `loading`, `error` 상태 직접 만들어야 함 | `useState`, `useEffect`, `try-catch` 반복 |
| 같은 데이터를 여러 컴포넌트에서 쓰기 어려움 | 상태 공유/동기화가 어려움 |
| 캐싱 없음 | 페이지 이동할 때마다 새로 요청 |
| 재시도, 자동 refetch 없음 | 실패하면 직접 재요청 코드를 짜야 함 |
| 데이터 무효화 어려움 | 예: POST 후 GET을 다시 하려면 수동으로 해야 함 |

---

## 2. React Query를 쓸 경우

```tsx
const { data, isLoading, error } = useQuery(['posts'], getPosts);
```

자동으로 아래 기능들을 제공한다:

| 기능 | 설명 |
| --- | --- |
| 자동 로딩 상태 (`isLoading`) | UI에 바로 반영 가능 |
| 자동 에러 상태 (`error`) | 에러 처리 간단 |
| 데이터 캐싱 | 이미 불러온 데이터는 재요청 X |
| 리페치 & 무효화 (`invalidateQueries`) | POST 이후 자동 새로고침 가능 |
| 재시도 / 백오프 기능 | 네트워크 불안정에도 안정적 |
| 쿼리 키 기반 상태관리 | 전역 공유처럼 활용 가능 |
| 개발자 도구 지원 | React Query Devtools로 상태 실시간 확인 |

---

## 정리: 언제 React Query를 쓰는 게 좋을까?

| 상황 | React Query |
| --- | --- |
| 한두 개 API만 호출하는 간단한 앱 | 없어도 됨 |
| 여러 페이지에서 동일 데이터를 공유해야 함 | 추천 |
| 리스트 → 상세 → 수정 후 목록 갱신 등 흐름 있음 | 필수 수준 |
| 로딩, 에러 처리 자동화하고 싶음 | 굿 |
| 실시간 데이터 or 무한 스크롤 필요 | 강력함 |

# 