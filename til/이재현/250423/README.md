# Today I Learned

> 2025년 04월 23일 이재현

# TypeScript Utility Types: Pick, Omit 그리고 타입 변환의 모든 것

## 서론

TypeScript로 개발할 때 객체 타입을 효율적으로 관리하는 것은 코드 품질과 유지보수성에 큰 영향을 미친다. 특히 비슷한 구조를 가진 여러 타입을 정의할 때, 매번 새로운 타입을 처음부터 작성하는 것은 비효율적이다. 이런 상황에서 TypeScript의 유틸리티 타입(Utility Types)을 활용하면 코드 중복을 줄이고 타입 관리를 간소화할 수 있다.
TypeScript의 대표적인 유틸리티 타입인 `Pick`과 `Omit`을 중심으로, 객체 타입 변환(Object Type Transformation)의 개념과 실제 사용 사례를 상세히 살펴보자.

## 객체 타입 변환이란?

객체 타입 변환은 기존에 정의된 타입이나 인터페이스를 기반으로 새로운 타입을 생성하는 과정이다. 이는 주로 객체의 속성(프로퍼티)을 선택하거나 제외하는 방식으로 이루어진다.

TypeScript는 이러한 변환을 위한 다양한 유틸리티 타입을 제공한다:

- `Pick<Type, Keys>`: 기존 타입에서 특정 속성만 선택
- `Omit<Type, Keys>`: 기존 타입에서 특정 속성만 제외
- `Partial<Type>`: 모든 속성을 선택적으로 만듦
- 그 외 `Required`, `Readonly`, `Record` 등

이러한 유틸리티 타입을 사용하면 코드의 재사용성을 높이고 DRY(Don't Repeat Yourself) 원칙을 준수할 수 있다.

## 실제 사례: 사용자 타입 시스템

다음과 같은 사용자 타입 시스템을 가정해 봅시다:

```
AbstractUser
  - macAddress: string
  - username: string

GuestUser (AbstractUser 상속)
  - userId: string
  - macAddress: string
  - username: string

Subscriber
  - userId: int
  - macAddress: string
  - username: string
  - email: string
  - password: string
  - firstName: string
  - lastName: string

SuperbUser
  - userId: int
  - macAddress: string
  - username: string
  - email: string
  - password: string
  - firstName: string
  - lastName: string
  - roles: string[]

Editor
  - userId: int
  - macAddress: string
  - username: string
  - email: string
  - password: string
  - firstName: string
  - lastName: string
  - roles: string[]

Admin
  - userId: int
  - macAddress: string
  - username: string
  - email: string
  - password: string
  - firstName: string
  - lastName: string
  - roles: string[]

```

이 구조를 TypeScript로 구현할 때 몇 가지 접근법이 있습니다.

## 접근법 1: 개별 인터페이스 정의

가장 직관적인 방법은 각 사용자 타입을 개별 인터페이스로 정의하는 것입니다:

```tsx
interface AbstractUser {
  macAddress: string;
  username: string;
}

interface GuestUser extends AbstractUser {
  userId: string;
}

interface Subscriber {
  userId: number;
  macAddress: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface SuperbUser {
  userId: number;
  macAddress: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// Editor와 Admin도 비슷하게 정의...

```

이 방식은 직관적이지만 속성이 중복되어 DRY 원칙을 위반한다. 만약 `username` 속성의 타입이 변경되면 모든 인터페이스를 수정해야 한다.

## 접근법 2: 상속을 활용한 인터페이스 정의

인터페이스 상속을 활용하면 중복을 줄일 수 있다:

```tsx
interface AbstractUser {
  macAddress: string;
  username: string;
}

interface BaseUser extends AbstractUser {
  userId: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface GuestUser extends AbstractUser {
  userId: string;
}

interface Subscriber extends BaseUser {}

interface SuperbUser extends BaseUser {
  roles: string[];
}

interface Editor extends BaseUser {
  roles: string[];
}

interface Admin extends BaseUser {
  roles: string[];
}

```

이 방식은 공통 속성을 상속으로 관리할 수 있어 중복이 줄어든다. 그러나 상속 관계가 복잡해질 수 있고, 여전히 SuperbUser, Editor, Admin에서 `roles` 속성이 중복된다.

## 접근법 3: Pick 유틸리티 타입 활용

`Pick` 유틸리티 타입을 사용하면 기존 타입에서 원하는 속성만 선택하여 새 타입을 만들 수 있다:

```tsx
// 모든 가능한 필드를 포함한 기본 타입 정의
interface AllUserFields {
  userId: number | string;
  macAddress: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// 각 사용자 타입을 Pick으로 정의
type AbstractUser = Pick<AllUserFields, 'macAddress' | 'username'>;

type GuestUser = Pick<AllUserFields, 'userId' | 'macAddress' | 'username'> & { userId: string };

type Subscriber = Pick<AllUserFields, 'userId' | 'macAddress' | 'username' | 'email' | 'password' | 'firstName' | 'lastName'> & { userId: number };

type SuperbUser = Pick<AllUserFields, 'userId' | 'macAddress' | 'username' | 'email' | 'password' | 'firstName' | 'lastName' | 'roles'> & { userId: number };

type Editor = Pick<AllUserFields, 'userId' | 'macAddress' | 'username' | 'email' | 'password' | 'firstName' | 'lastName' | 'roles'> & { userId: number };

type Admin = Pick<AllUserFields, 'userId' | 'macAddress' | 'username' | 'email' | 'password' | 'firstName' | 'lastName' | 'roles'> & { userId: number };

```

이 방식의 장점은 모든 필드를 한 곳에서 관리한다는 것이다. 하지만 각 타입 정의가 길어지고, 타입 간의 관계가 직관적으로 보이지 않을 수 있다.

## 접근법 4: Omit 유틸리티 타입 활용

속성이 많은 타입에서 일부만 제외하려면 `Omit`이 더 효율적이다:

```tsx
// 모든 필드가 포함된 완전한 사용자 타입
interface FullUser {
  userId: number;
  macAddress: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// 기본 사용자 타입 (AbstractUser)
type AbstractUser = Pick<FullUser, 'macAddress' | 'username'>;

// GuestUser는 AbstractUser에 userId(string 타입) 추가
type GuestUser = AbstractUser & { userId: string };

// Subscriber는 FullUser에서 roles만 제외
type Subscriber = Omit<FullUser, 'roles'>;

// SuperbUser, Editor, Admin은 모든 속성을 포함한 FullUser
type SuperbUser = FullUser;
type Editor = FullUser;
type Admin = FullUser;

```

이 방식은 `Pick`보다 간결하게 타입을 정의할 수 있으며, 특히 많은 속성 중 소수만 제외할 때 유용하다.

## interface vs type: 무엇을 사용해야 할까?

TypeScript에서 `interface`와 `type`은 비슷한 목적으로 사용되지만 몇 가지 중요한 차이점이 있다:

### 1. 확장성

- `interface`는 선언 병합(declaration merging)이 가능하다. 같은 이름으로 여러 번 선언하면 자동으로 합쳐진다.
- `type`은 한 번 선언한 후 확장할 수 없다.

### 2. 유니온/인터섹션

- `type`은 유니온 타입(`|`)을 직접 정의할 수 있다.
- `interface`는 유니온 타입을 직접 표현할 수 없다.

### 3. 기본 타입 확장

- `type`은 기본 타입에 별칭을 줄 수 있다: `type ID = string`
- `interface`는 객체 구조만 정의할 수 있다.

### 4. 퍼포먼스

- 복잡한 타입에서 `interface`가 때때로 컴파일 성능이 더 좋을 수 있다.
- 단순한 경우 차이가 거의 없다.

## 선언 병합(Declaration Merging)의 활용

선언 병합은 `interface`의 독특한 특성으로, 같은 이름의 인터페이스를 여러 번 선언하면 자동으로 합쳐진다. 이는 다음과 같은 상황에서 유용하다:

### 1. 외부 라이브러리 확장

외부 라이브러리에서 제공하는 인터페이스에 새로운 속성을 추가할 때:

```tsx
// 라이브러리에서 제공하는 기본 정의
interface FullUser {
  userId: number;
  macAddress: string;
  username: string;
  // ...기타 속성
}

// 프로젝트에서 추가 필드 확장
interface FullUser {
  lastLoginDate: Date;       // 마지막 로그인 날짜 추가
  profilePictureUrl: string; // 프로필 사진 URL 추가
}

```

### 2. 코드 분리와 모듈화

큰 인터페이스를 여러 파일이나 모듈로 분리할 때:

```tsx
// users/base.ts 파일
interface FullUser {
  userId: number;
  macAddress: string;
}

// users/profile.ts 파일
interface FullUser {
  firstName: string;
  lastName: string;
}

// users/security.ts 파일
interface FullUser {
  password: string;
  roles: string[];
}

```

### 3. 점진적 개발

애플리케이션의 발전에 따라 인터페이스를 점진적으로 확장할 때:

```tsx
// 초기 개발 단계
interface FullUser {
  userId: number;
  username: string;
}

// 인증 기능 추가 시
interface FullUser {
  password: string;
  roles: string[];
}

```

## 유틸리티 타입 비교: Pick vs. Omit vs. Partial

| 유틸리티 | 기능 | 사용 시점 |
| --- | --- | --- |
| `Pick<Type, Keys>` | 특정 속성만 선택 | 필요한 속성이 소수일 때 |
| `Omit<Type, Keys>` | 특정 속성 제외 | 제외할 속성이 소수일 때 |
| `Partial<Type>` | 모든 속성을 선택적으로 만듦 | 옵션 객체나 업데이트 객체를 만들 때 |

## 결론: 언제 어떤 방식을 사용해야 할까?

1. **복잡한 상속 관계가 있을 때**: 인터페이스 상속을 사용한다.
2. **기존 타입에서 소수의 속성만 필요할 때**: `Pick`을 사용한다.
3. **기존 타입에서 대부분의 속성이 필요하고 일부만 제외할 때**: `Omit`을 사용한다.
4. **타입이 확장되거나 병합될 가능성이 있을 때**: `interface`를 사용한다.
5. **유니온 타입이나 교차 타입이 필요할 때**: `type`을 사용한다.

TypeScript의 유틸리티 타입을 효과적으로 활용하면 코드 중복을 줄이고, 타입 시스템을 더 강력하게 만들 수 있다. 각 프로젝트의 요구사항과 특성에 맞게 적절한 방법을 선택하는 것이 중요하다.

TypeScript의 유틸리티 타입은 단순히 코드를 줄이는 것을 넘어, 타입 안전성을 높이고 코드의 의도를 명확하게 전달하는 강력한 도구다. 이를 적절히 활용하여 더 견고하고 유지보수가 쉬운 코드를 작성하자.