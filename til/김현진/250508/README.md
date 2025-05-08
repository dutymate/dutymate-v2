# TIL

날짜 : 2025-05-08 (목목)

 <br>

# Delete 시 발생하는 문제와 해결 방법법

## 문제 상황

그룹 탈퇴 API를 구현하면서, 그룹장이 탈퇴하면 남은 그룹을 어떻게 처리할지에 대한 문제가 발생함.

특히 그룹장이 유일한 멤버일 경우, 그룹 자체를 삭제해야 하는지에 대한 명확한 분기 처리가 필요했음.

<br>

## 해결 방법

GroupMember 엔티티의 isLeader 필드를 기준으로, 그룹장이 탈퇴하는 경우를 체크함

나 혼자일 경우 → 그룹 자체 삭제

멤버가 더 있을 경우 → 가장 오래된 멤버에게 isLeader를 위임하고, 본인은 탈퇴 처리

<br>

## 사용한 핵심 코드

```java
if (groupMember.getIsLeader()) {
	List<GroupMember> otherMembers = group.getGroupMemberList().stream()
		.filter(gm -> !gm.getGroupMemberId().equals(groupMember.getGroupMemberId()))
		.sorted(Comparator.comparing(GroupMember::getCreatedAt))
		.toList();

	if (otherMembers.isEmpty()) {
		groupRepository.delete(group);
		return;
	} else {
		otherMembers.getFirst().setIsLeader(true);
	}
}
group.getGroupMemberList().remove(groupMember);
groupMemberRepository.delete(groupMember);
```

<br>

## 새롭게 알게 된 점

1. orphanRemoval = true를 설정하면 JPA 연관 관계에서 자식 자동 삭제가 가능함

2. List.stream().filter().sorted().toList()를 통해 오래된 순 정렬이 가능함

3. 엔티티를 삭제하기 전에 반드시 부모-자식 연관 관계에서도 직접 제거 (remove()) 해줘야 함
