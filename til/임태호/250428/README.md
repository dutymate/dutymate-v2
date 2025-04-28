# Today I Learned

> 2025년 04월 28일 임태호

## 1. 데모 계정에 임시 간호사 10명 추가하기
- 데모 계정에 본인 말고 아무도 없어서 자동 생성을 체험해보기 불편하다는 피드백이 있었다.
- 그래서 데모 계정에 기본값으로 임시 간호사를 10명 추가해놓도록 개선하였고, 사용자는 바로 자동 생성 서비스를 체험할 수 있게 하였다.
```java
// 5. 새로운 임시간호사 리스트 생성
List<Member> newMemberList = new ArrayList<>();
List<WardMember> newWardMemberList = new ArrayList<>();
for (int tempNurseSeq = 1; tempNurseSeq <= DEMO_TEMP_NURSE_CNT; tempNurseSeq++) {
    String tempNurseName = "간호사" + tempNurseSeq;

    Member tempMember = Member.builder()
        .email("tempEmail@temp.com")
        .name(tempNurseName)
        .password("tempPassword123!!")
        .grade(1)
        .role(Role.RN)
        .gender(Gender.F)
        .provider(Provider.NONE)
        .profileImg(addBasicProfileImgUrl())
        .autoGenCnt(0)
        .build();
    WardMember tempWardMember = WardMember.builder()
        .isSynced(false)
        .ward(ward)
        .member(tempMember)
        .build();
    // 5-1. 9번과 10번 간호사는 근무 유형을 Night로 설정
    if (tempNurseSeq == 9 || tempNurseSeq == 10) {
        tempWardMember.setShiftType(ShiftType.N);
    }
    newMemberList.add(tempMember);
    newWardMemberList.add(tempWardMember);
    ward.addWardMember(tempWardMember);
}

ward.changeTempNurseSeq(DEMO_TEMP_NURSE_CNT);
// 6. 임시 간호사 리스트를 RDB에 저장
memberRepository.saveAll(newMemberList);
wardMemberRepository.saveAll(newWardMemberList);
```

## 문제 상황
- 5-1번 주석을 보면 9번과 10번 간호사는 근무 유형을 Night로 고정하였다. 그런데 실제로는 적용되지 않았다.

## 해결 방안
- WardMember 엔터티에 PrePersist 옵션이 있어 간호사 근무 유형을 지정할 수 없었다.
- 그래서 근무 유형이 null일 때만 근무 유형을 기본 값으로 지정하게 수정하였다.
```java
@PrePersist
protected void prePersist() {
    if (this.shiftType == null) { // <- 추가된 부분
        if (this.member.getRole() == Role.HN) {
            this.shiftType = ShiftType.M;
        } else {
            this.shiftType = ShiftType.ALL;
        }
    }
}
```

## 2. 데모 계정 일괄 삭제 API를 벌크 연산 방식으로 최적화하여 성능 개선

### 문제 상황
- 앞서 데모 계정에 임시 간호사 10명을 넣는 로직을 추가했다.
- 그래서 데모 계정을 일괄로 삭제할 때마다 DELETE 쿼리가 과도하게 나가는 문제가 발생했다.
- 예를 들어, **10개의 데모 계정이 있다면 110개의 DELETE 쿼리**가 나갔다.
- 거기에 더해 SELECT 쿼리도 N+1 문제로 과도하게 나가는 문제가 있었다.

### 해결 방안
- 삭제할 엔터티와 id값을 미리 리스트에 넣어놓는다.
- 그 리스트를 일괄로 삭제 처리한다.
- SELECT 쿼리는 **지연 로딩** 대신 **페치 조인**을 이용해 즉시 로딩한다.
- N+1 문제 해결!
- 기존 110개 나가던 쿼리를 10개 수준으로 줄일 수 있었다.
- fetch join으로 한 방에 가져와서 N+1 없애고, `deleteAllInBatch()`로 벌크 삭제하는 구조로 변경했다.

| 문제 | 해결책 |
| --- | --- |
| Ward → WardMember → Member 조회 시 N+1 발생 | `@Query` + `JOIN FETCH`로 한 번에 조회 |


```java
// 3. 삭제 대상 WardId 모으기
List<Long> wardIdsToDelete = new ArrayList<>();
for (Member demoMember : demoMembers) {
    if (!demoMemberIdSet.contains(demoMember.getMemberId())) {
        Ward ward = demoMember.getWardMember().getWard();
        wardIdsToDelete.add(ward.getWardId());
    }
}

// 4. Ward + WardMember + Member를 fetch join으로 한 번에 가져오기
List<Ward> wards = wardRepository.findWardsWithMembersByWardIdIn(wardIdsToDelete);

List<Member> membersToDelete = new ArrayList<>();
for (Ward ward : wards) {
    for (WardMember wardMember : ward.getWardMemberList()) {
        membersToDelete.add(wardMember.getMember());
    }
}

// 5. 벌크 삭제
wardScheduleRepository.deleteByWardIdIn(wardIdsToDelete);
wardRepository.deleteAllInBatch(wards);
memberRepository.deleteAllInBatch(membersToDelete);
```

```java
@Query("SELECT DISTINCT w FROM Ward w "
    + "JOIN FETCH w.wardMemberList wm "
    + "JOIN FETCH wm.member "
    + "WHERE w.wardId IN :wardIds")
List<Ward> findWardsWithMembersByWardIdIn(@Param("wardIds") List<Long> wardIds);
```

## 오늘 새롭게 알게 된 내용!
- `deleteAllInBatch()`는 JPA가 `WHERE IN (...)`으로 한 번에 삭제 쿼리를 날린다.
- `deleteAllInBatch()`는 영속성 컨텍스트를 무시하고 바로 DB에 delete 쿼리를 날린다. (flush 됨)
- MongoDB는 deleteOne보다 deleteMany가 훨씬 빠르다.
- MongoRepository는 `deleteBy필드명In(List<TYPE> values)` 형태를 지원한다.
- `deleteByWardIdIn(List<Long> ids)`를 쓰면, 내부적으로 deleteMany가 실행돼서 성능은 어느 정도 확보돼.
- MongoRepository는 기본적으로 "soft delete" 기능을 제공하지 않으니까, 데이터 복구가 필요한 경우에는 따로 백업이 필요할 수 있어.