
# Today I Learned

> 2025년 05월 02일 임태호

## 오늘 배운 내용

- 객체지향 설계 5대 원칙인 **SOLID 원칙**
- Java 코드에서 자주 발생하는 **오버엔지니어링 사례**

---

## SOLID 원칙 정리

| 원칙 | 이름 | 설명 |
|------|------|------|
| S | Single Responsibility Principle (단일 책임 원칙) | 클래스는 하나의 책임만 가져야 하며, 변경 이유도 하나여야 한다. |
| O | Open/Closed Principle (개방-폐쇄 원칙) | 확장에는 열려 있어야 하고, 변경에는 닫혀 있어야 한다. |
| L | Liskov Substitution Principle (리스코프 치환 원칙) | 자식 클래스는 부모 클래스의 기능을 대체할 수 있어야 한다. |
| I | Interface Segregation Principle (인터페이스 분리 원칙) | 클라이언트에 꼭 필요한 인터페이스만 제공해야 한다. |
| D | Dependency Inversion Principle (의존 역전 원칙) | 고수준 모듈과 저수준 모듈이 모두 추상화에 의존해야 한다. |

## 1. S - 단일 책임 원칙 (Single Responsibility Principle, SRP)

> 클래스는 단 하나의 책임만 가져야 한다.

- 하나의 클래스는 하나의 변경 이유만 가져야 하며, 오직 하나의 기능만 수행해야 한다.

✅ **예시**  
게시글을 저장하는 클래스는 저장만 하고, 출력은 다른 클래스가 담당한다.

```java
class PostSaver {
    public void save(Post post) {
        // 저장 로직
    }
}

class PostPrinter {
    public void print(Post post) {
        // 출력 로직
    }
}
```

## 2. O - 개방-폐쇄 원칙 (Open/Closed Principle, OCP)

> 확장에는 열려 있고, 변경에는 닫혀 있어야 한다.

- 기존 코드를 변경하지 않고도 기능을 확장할 수 있어야 한다.
- 보통 **인터페이스**나 **추상 클래스**를 도입하여 구현한다.

✅ **예시**  
인터페이스를 활용해 다양한 할인 정책을 유연하게 확장

```java
interface DiscountPolicy {
    int calculateDiscount(int price);
}

class FixedDiscountPolicy implements DiscountPolicy {
    public int calculateDiscount(int price) {
        return 1000;
    }
}

class RateDiscountPolicy implements DiscountPolicy {
    public int calculateDiscount(int price) {
        return price * 10 / 100;
    }
}
```

## 3. L - 리스코프 치환 원칙 (Liskov Substitution Principle, LSP)

> 자식 클래스는 부모 클래스를 대체할 수 있어야 한다.

- 부모 객체를 사용하는 곳에 자식 객체를 넣어도 동일하게 동작해야 한다.
- **오작동하거나 예외를 던지면 LSP를 위반한 것**

❌ **위반 예시**

```java
class Bird {
    void fly() { }
}

class Ostrich extends Bird {
    void fly() {
        throw new UnsupportedOperationException("타조는 날 수 없습니다.");
    }
}
```

- `Bird`를 사용하는 코드에서 `Ostrich`를 넣으면 예외 발생 → LSP 위반

## 4. I - 인터페이스 분리 원칙 (Interface Segregation Principle, ISP)

> 클라이언트에 꼭 필요한 인터페이스만 제공해야 한다.

- 커다란 범용 인터페이스보다는 **작고 구체적인 인터페이스 여러 개로 분리**하는 것이 낫다.

✅ **예시**

```java
interface Printer {
    void print();
}

interface Scanner {
    void scan();
}

class BasicPrinter implements Printer {
    public void print() {
        System.out.println("인쇄 중...");
    }
}

class AllInOnePrinter implements Printer, Scanner {
    public void print() { ... }
    public void scan() { ... }
}
```

## 5. D - 의존 역전 원칙 (Dependency Inversion Principle, DIP)

> 고수준 모듈과 저수준 모듈이 모두 추상화에 의존해야 한다.

- 구현체가 아닌 인터페이스에 의존하도록 설계한다.
- **DI (Dependency Injection)** 를 통해 객체를 주입받는다.

✅ **예시**

```java
interface NotificationService {
    void send(String message);
}

class EmailService implements NotificationService {
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

class NotificationManager {
    private final NotificationService service;

    public NotificationManager(NotificationService service) {
        this.service = service;
    }

    public void notify(String message) {
        service.send(message);
    }
}
```

---

## 자바에서의 오버엔지니어링 사례

### 1. 불필요한 인터페이스 사용

```java
interface UserService {
    void createUser(String name);
}

class UserServiceImpl implements UserService {
    public void createUser(String name) {
        System.out.println("User created: " + name);
    }
}
```
구현체가 하나뿐인데도 불필요하게 인터페이스를 사용하는 것은 과한 추상화

### 2. Factory 패턴 과사용

```java
class Dog {
    public void sound() {
        System.out.println("멍멍");
    }
}

class AnimalFactory {
    public Dog createDog() {
        return new Dog();
    }
}
```
단순 객체 생성에 굳이 팩토리 클래스를 만들 필요는 없음

### 3. 불필요한 추상 클래스 도입

```java
abstract class BaseRepository {
    abstract void save(String data);
}

class UserRepository extends BaseRepository {
    void save(String data) {
        System.out.println("User saved: " + data);
    }
}
```
상속할 필요도 없는데 추상 클래스를 사용하는 것은 구조만 복잡하게 만듦

### 4. 수동 DI 남용

```java
class Logger {
    void log(String msg) {
        System.out.println("LOG: " + msg);
    }
}

class ReportService {
    private Logger logger;
    public ReportService(Logger logger) {
        this.logger = logger;
    }
}
```
DI 프레임워크를 사용하지도 않는데 무조건 의존성 주입 구조를 강제하는 것은 오히려 불편함

### 5. 제너릭/유틸 남용

```java
class JsonSerializer<T> {
    public String serialize(T obj) {
        return "{}"; // 실제 기능 없음
    }
}
```
실제 구현도 없는데 구조만 미리 거창하게 만들어둠


## 느낀 점
- SOLID 원칙은 잘 지키면 유지보수성과 확장성이 좋아지지만, 무분별하게 적용하면 오히려 코드가 복잡해질 수 있다.

- “지금 필요한 만큼만 설계하자”는 마음가짐이 중요하다.

- 추상화는 필요할 때 도입해야지, 미래를 막연히 대비해서 미리 적용하는 건 오히려 독이 될 수 있다.
