# TIL: JPA Cascade와 데이터베이스 ON DELETE CASCADE의 차이점

## 개념적 이해

JPA에서 `cascade` 옵션과 데이터베이스의 `ON DELETE CASCADE`는 비슷한 목적을 가지고 있지만, 작동하는 레벨과 방식이 완전히 다릅니다. 이러한 차이점으로 인해 개발자가 예상하지 못한 동작이 발생할 수 있습니다.

### JPA Cascade (Java 애플리케이션 레벨)

JPA의 cascade는 Java 애플리케이션 내에서 엔티티 간의 연산을 전파하는 메커니즘입니다:

- **작동 위치**: 메모리 내 영속성 컨텍스트(Persistence Context)
- **영향 범위**: JPA가 관리하는 엔티티 객체에만 적용
- **주요 목적**: 엔티티 간의 작업(저장, 업데이트, 삭제 등)을 자동화
- **구현 방식**: Hibernate와 같은 JPA 구현체가 JDBC를 통해 필요한 SQL 쿼리를 생성하고 실행

```java
@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Child> children;
```

이 설정은 "parent 엔티티를 삭제할 때, JPA가 관련된 모든 children 엔티티도 함께 삭제하라"는 의미입니다.

### 데이터베이스 ON DELETE CASCADE (데이터베이스 레벨)

데이터베이스의 ON DELETE CASCADE는 데이터베이스 시스템 자체에 내장된 기능입니다:

- **작동 위치**: 데이터베이스 서버
- **영향 범위**: 데이터베이스 테이블과 레코드
- **주요 목적**: 참조 무결성(Referential Integrity) 유지
- **구현 방식**: 데이터베이스 엔진이 외래 키 제약조건을 처리

```sql
ALTER TABLE child
ADD CONSTRAINT fk_child_parent
FOREIGN KEY (parent_id) REFERENCES parent(id)
ON DELETE CASCADE;
```

이 설정은 "parent 테이블의 레코드가 삭제될 때, 데이터베이스가 자동으로 연결된 child 테이블의 레코드도 삭제하라"는 의미입니다.

## 왜 JPA Cascade가 데이터베이스 ON DELETE CASCADE로 자동 변환되지 않는가?

JPA를 사용하여 엔티티를 정의하고 테이블을 자동 생성할 때, JPA의 cascade 옵션이 데이터베이스의 ON DELETE CASCADE로 자동 변환되지 않는 이유는 다음과 같습니다:

1. **설계 철학의 차이**:
   - JPA는 객체 지향 프로그래밍과 관계형 데이터베이스 간의 패러다임 불일치를 해소하기 위한 것
   - 데이터베이스 외래 키는 데이터 무결성을 보장하기 위한 것
   - 이 두 메커니즘은 서로 다른 문제를 해결하기 위해 설계됨

2. **실행 컨텍스트의 차이**:
   - JPA cascade는 애플리케이션이 실행 중일 때만 작동
   - 데이터베이스 CASCADE는 어떤 클라이언트가 데이터베이스에 접근하더라도 항상 작동
   - 이러한 차이로 인해 두 기능을 자동으로 연결하는 것은 예기치 않은 결과를 초래할 수 있음

3. **Hibernate의 기본 설계 결정**:
   - Hibernate(JPA 구현체)는 의도적으로 이 두 기능을 분리하여 개발자가 각각 명시적으로 구성할 수 있도록 설계됨
   - 이는 개발자에게 더 많은 제어력을 제공하지만, 동시에 두 설정을 일치시켜야 하는 책임도 부여함

4. **다양한 데이터베이스 방언**:
   - 각 데이터베이스 시스템마다 CASCADE 옵션 구현 방식이 다를 수 있음
   - JPA는 이러한 다양성을 고려하여 최소한의 공통 기능만 자동화하는 접근법을 취함

## 실제 문제 상황

```java
// JPA 엔티티 설정
@Entity
public class Parent {
    @Id
    private Long id;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Child> children;
}

@Entity
public class Child {
    @Id
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Parent parent;
}
```

위 코드에서 JPA cascade는 설정되어 있지만, 실제 생성된 데이터베이스 스키마에는 ON DELETE CASCADE가 없을 수 있습니다:

```sql
CREATE TABLE child (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    CONSTRAINT fk_child_parent FOREIGN KEY (parent_id) REFERENCES parent(id)
    -- ON DELETE CASCADE가 없음!
);
```

이러한 상황에서 발생할 수 있는 문제:

1. **JPA를 통한 삭제**: Parent 엔티티를 JPA를 통해 삭제하면, 먼저 Child 엔티티를 삭제한 후 Parent 엔티티를 삭제합니다. 일반적으로 문제 없이 작동합니다.

2. **데이터베이스 직접 삭제**: 데이터베이스에서 직접 Parent 레코드를 삭제하려고 하면, 외래 키 제약조건 위반으로 오류가 발생합니다.

3. **다른 애플리케이션에서 삭제**: JPA를 사용하지 않는 다른 애플리케이션이 데이터베이스에 접근하여 삭제 작업을 수행할 경우, 예기치 않은 오류가 발생할 수 있습니다.

## 해결 방법

### 1. Hibernate @OnDelete 어노테이션 사용

```java
@Entity
public class Child {
    @Id
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Parent parent;
}
```

이 어노테이션은 Hibernate가 테이블을 생성할 때 외래 키에 ON DELETE CASCADE 제약조건을 추가하도록 지시합니다.

### 2. SQL 스크립트를 통한 제약조건 수정

```sql
ALTER TABLE child 
DROP FOREIGN KEY fk_child_parent,
ADD CONSTRAINT fk_child_parent 
FOREIGN KEY (parent_id) 
REFERENCES parent (id) 
ON DELETE CASCADE;
```

이 SQL을 애플리케이션 시작 시 실행하거나, 데이터베이스 마이그레이션 도구(Flyway, Liquibase 등)를 사용하여 적용할 수 있습니다.

### 3. 초기화 스크립트 사용

Spring Boot를 사용하는 경우:

```properties
spring.jpa.properties.hibernate.hbm2ddl.import_files=classpath:db/foreign_keys.sql
```

그리고 `foreign_keys.sql` 파일에 ALTER TABLE 문을 추가합니다.

### 4. 명시적인 삭제 순서 관리

서비스 레이어에서 삭제 로직을 직접 제어:

```java
@Transactional
public void deleteParent(Long parentId) {
    Parent parent = parentRepository.findById(parentId)
        .orElseThrow(() -> new EntityNotFoundException("Parent not found"));
    
    // 먼저 자식 엔티티 삭제
    childRepository.deleteByParentId(parentId);
    
    // 그 다음 부모 엔티티 삭제
    parentRepository.delete(parent);
}
```


## 결론

JPA의 cascade와 데이터베이스의 ON DELETE CASCADE는 서로 보완적이지만 자동으로 연결되지 않는 별개의 메커니즘입니다. 두 기능의 차이점을 이해하고 적절히 설정하는 것이 중요합니다. 일관성 있는 데이터 관리를 위해 두 설정을 일치시키거나, 의도적으로 다르게 설정하는 경우 해당 결정의 이유와 영향을 문서화해야 합니다.
