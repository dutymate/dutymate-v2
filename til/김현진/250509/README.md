# TIL

날짜 : 2025-05-09 (금)

<br>

# 단일 그룹 조회 시 TreeMap 사용 이유와 구현

## 어려웠던 점

그룹 상세 조회 API에서 날짜별로 멤버들의 근무 정보를 정렬된 순서로 반환해야 함

일반적인 HashMap은 key 순서 보장이 없어, 날짜 정렬이 되지 않는 문제가 있었음

또한 MongoDB에 MemberSchedule이 없는 멤버는 응답에 빠지는 문제가 있었음

<br>

## 해결 방법

날짜 정렬을 위해 `TreeMap<LocalDate, List<MemberDto>>` 사용

groupMemberList 전체를 기준으로 loop을 돌리면서, 스케줄이 없는 경우 "X"로 채움

duty는 charAt(day - 1) 방식으로 날짜별로 분해하여 DTO 생성

<br>

## 🧩 사용한 핵심 코드

```java
Map<Long, MemberSchedule> scheduleMap = scheduleList.stream()
.collect(Collectors.toMap(MemberSchedule::getMemberId, s -> s));

for (GroupMember gm : groupMemberList) {
Long memberId = gm.getMember().getMemberId();
String name = gm.getMember().getName();

    String shiftStr = scheduleMap.containsKey(memberId) && scheduleMap.get(memberId).getShifts() != null
    	? scheduleMap.get(memberId).getShifts()
    	: "X".repeat(daysInMonth);

    for (int day = 1; day <= daysInMonth; day++) {
    	String duty = String.valueOf(shiftStr.charAt(day - 1));
    	LocalDate date = yearMonth.atDay(day);

    	GroupDetailResponseDto.MemberDto dto = GroupDetailResponseDto.MemberDto.builder()
    		.memberId(memberId)
    		.name(name)
    		.duty(duty)
    		.build();

    	dateToMembersMap.computeIfAbsent(date, k -> new ArrayList<>()).add(dto);
    }

}
```

<br>

## 새롭게 알게 된 점

### 01. TreeMap<K, V>

> 날짜 기준 정렬을 위해 사용함

TreeMap은 key 기준으로 자동 정렬되며, 날짜 데이터를 다룰 때 가장 적절한 Map 구현체이다.

- TreeMap은 Map의 구현체로, key 값이 자동으로 오름차순 정렬된다.

- key가 LocalDate일 경우, 날짜가 빠른 순으로 정렬된다.

- 내부적으로 Red-Black Tree를 사용한다.

<br>

사용 예:

```java
Map<LocalDate, List<MemberDto>> map = new TreeMap<>();
map.put(LocalDate.of(2025, 5, 1), ...); // 자동 정렬됨
```

### 02. computeIfAbsent()

> 날짜별로 멤버 리스트 초기화할 때 사용됨

computeIfAbsent()는 key가 없을 경우 value를 생성하고 바로 사용할 수 있어, 매우 간결하다.

- 지정한 key가 없으면 value를 새로 생성해서 넣고, 그 값을 리턴한다.

- 흔히 `if (!map.containsKey(...)) + put()` 조합을 한 줄로 처리할 수 있다.

<br>

사용 예:

```java
dateToMembersMap.computeIfAbsent(date, k -> new ArrayList<>()).add(dto);
```

이 줄을 풀어서 쓰면 아래와 같습니다.

```java
if (!dateToMembersMap.containsKey(date)) {
    dateToMembersMap.put(date, new ArrayList<>());
}
dateToMembersMap.get(date).add(dto);
```
