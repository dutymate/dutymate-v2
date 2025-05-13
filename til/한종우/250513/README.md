# Today I Learned

> 2025년 05월 13일

## 오늘의 장애 부검

3차 배포 이후, ECS 클러스터의 서비스가 중단되고 있었습니다.
로그를 확인해보니 다음과 같은 에러가 발생했습니다.

```shell
java.sql.SQLIntegrityConstraintViolationException: Cannot delete or update a parent row: a foreign key constraint fails (`dutymate_db`.`color`, CONSTRAINT `FK80a6h44fkk8lckepcw9t4x03v` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`))
```

이 에러는 `member` 테이블의 `member_id`를 참조하는 외래 키 제약 조건이 있는 `color` 테이블에서 발생했습니다.
`member` 테이블에서 `member_id`를 삭제하려고 할 때, `color` 테이블에서 해당 `member_id`를 참조하고 있는 레코드가 존재하면 이 에러가 발생합니다. 즉, `color` 테이블의 외래 키 제약 조건 때문에 `member` 테이블의 레코드를 삭제할 수 없다는 것입니다.

이 문제를 해결하기 위해 백엔드 팀원이 `color` 테이블의 외래 키 제약 조건을 삭제하고, `member` 테이블의 레코드를 삭제한 후, 다시 외래 키 제약 조건을 추가했습니다.

```sql
ALTER TABLE color DROP FOREIGN KEY FK80a6h44fkk8lckepcw9t4x03v;

ALTER TABLE color
ADD CONSTRAINT FK80a6h44fkk8lckepcw9t4x03v
FOREIGN KEY (member_id) REFERENCES member(member_id)
ON DELETE CASCADE;
```

이 쿼리는 `color` 테이블의 외래 키 제약 조건을 삭제한 후, 다시 추가하는 쿼리입니다.
`ON DELETE CASCADE` 옵션을 사용하면, `member` 테이블에서 `member_id`를 삭제할 때, `color` 테이블에서도 해당 `member_id`를 참조하는 레코드가 자동으로 삭제됩니다.
즉, 외래 키 제약 조건을 추가할 때, `ON DELETE CASCADE` 옵션을 사용하면, 부모 레코드가 삭제될 때 자식 레코드도 함께 삭제되도록 설정할 수 있습니다.
