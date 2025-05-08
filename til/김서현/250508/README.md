# Today I Learned

> 2025년 05월 08일

# Axios vs AxiosInstance

## ✨ 개요

[Axios](https://axios-http.com/)는 Promise 기반의 HTTP 클라이언트로, 브라우저와 Node.js에서 모두 작동합니다.

`axios`: Axios 라이브러리의 기본 인스턴스
`axiosInstance`: `axios.create()`로 커스터마이징한 인스턴스

## 🔍 차이점 비교

| 항목 | axios | axiosInstance  
| 정의 | Axios의 기본 인스턴스 | 커스터마이징된 Axios
| 설정 | 매 요청마다 설정 필요 | 공통 설정을 미리 정의  
| 사용 편의성 | 간단한 요청에 적합 | 프로젝트 규모 커질수록 효율적  
| 예시 | `axios.get('/url')` | `axiosInstance.get('/url')`  
| 활용도 | 소규모 프로젝트 또는 간단한 요청 | 중·대형 프로젝트권장 |
| 기능 확장 | 제한적 | Interceptor등 고급 기능 사용 가능

## axios 예시

```js
import axios from "axios";

axios
  .get("https://api.example.com/data")
  .then((res) => console.log(res.data))
  .catch((err) => console.error(err));
```

- 요청마다 `baseURL`, 헤더 등을 수동으로 설정해야 함

-

## axiosInstance 예시

```js
// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default axiosInstance;
```

```js
// 사용 예시
import axiosInstance from "../api/axiosInstance";

axiosInstance.get("/data").then((res) => console.log(res.data));
```

- 프로젝트 전반에서 공통 설정을 공유하고 관리할 수 있음

---

## 결론

| 빠르게 단일 요청만 필요할 때 | `axios` |
| 프로젝트 전체에 공통 설정을 적용하고 싶을 때 | `axiosInstance` |

## 참고 자료

- [Axios 공식 문서](https://axios-http.com/docs/instance)
- [MDN - HTTP Headers](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers)
