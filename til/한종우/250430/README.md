# Today I Learned

> 2025년 04월 30일

## 프로덕션 환경에서 console 비활성화하기

프로젝트를 개발할 때, `console.log()`를 사용하여 디버깅을 하게 된다.
하지만 프로덕션 환경에서는 `console.log()`가 남아있으면 보안상 문제가 될 수 있다.

사용자는 `console.log()`를 통해 내부 정보를 알 수 있고, 이는 보안 취약점으로 이어질 수 있다.
따라서 프로덕션 환경에서는 `console.log()`를 비활성화하는 것이 좋다.

### 방법

React 프로젝트에서 `console.log()`를 비활성화하는 방법은 다음과 같다.

```javascript
if (import.meta.env.PROD) {
    console = window.console || {};
    console.log = function no_console() {};
    console.warn = function no_console() {};
    console.error = function () {};
}
```

위 코드는 `import.meta.env.PROD`가 true일 때, `console.log()`, `console.warn()`, `console.error()`를 빈 함수로 덮어씌우는 코드이다.
이렇게 하면 프로덕션 환경에서 `console.log()`를 호출해도 아무런 동작을 하지 않게 된다.

### 주의사항

위 코드는 `console` 객체를 덮어씌우는 코드이기 때문에, `console` 객체의 다른 메서드도 사용할 수 없게 된다.
따라서 `console` 객체의 다른 메서드를 사용해야 하는 경우에는 주의해야 한다.
