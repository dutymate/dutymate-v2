# Today I Learned

> 2025년 05월 12일

Terraform에서 보안 그룹을 설정할 때, 아래와 같이 egress를 설정하면 매번 apply할 때마다 보안 그룹이 변경된다고 나옵니다.

```hcl
egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
}
```

이는 egress의 cidr_blocks가 빈 배열로 설정되어 있기 때문입니다. 이 경우 Terraform은 매번 새로운 보안 그룹을 생성하려고 시도합니다.

위의 egress는 모든 트래픽을 차단하는 설정입니다.
따라서 egress 설정이 필요하지 않다면 제외하는 것이 좋습니다.
