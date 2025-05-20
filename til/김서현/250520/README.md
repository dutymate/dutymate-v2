# Today I Learned

> 2025년 05월 20일 

## 📌 이미지 업로드 이슈 분석 및 회고 (30MB 제한 관련)


### 🔧 문제 상황

이미지 업로드 기능을 개발하며 프론트와 백엔드 모두에서 업로드 파일의 크기를 **30MB**로 제한하였다.
로컬 환경에서는 정상적으로 작동했지만, \*\*운영 환경(product)\*\*에서는 이미지 등록이 실패하였다.

---

### ✅ 백엔드(Spring Boot) 설정

```yaml
# application.yml
spring:
  servlet:
    multipart:
      maxFileSize: 30MB
      maxRequestSize: 30MB
```

* Spring Boot의 `multipart` 설정을 통해 최대 파일 업로드 크기를 30MB로 설정

---

### ✅ 프론트엔드(React) 코드

```tsx
const maxSize = 30 * 1024 * 1024; // 30MB
if (file.size > maxSize) {
  toast.error('파일 크기는 30MB 이하여야 합니다.');
  setIsImageUploading(false);
  return;
}
```

* 사용자 경험을 위해 업로드 전에 파일 크기를 검증하고, 초과 시 오류 메시지를 표시

---

### 🚨 문제 원인

로컬에선 문제없던 기능이 운영 서버에서는 작동하지 않았고,
그 원인은 **Nginx의 기본 업로드 크기 제한이 1MB로 설정**되어 있었기 때문이었다.

#### 🛠 Nginx 기본 설정 문제

```nginx
server {
  ...
  client_max_body_size 1m; # 기본값 (업로드 제한 1MB)
  ...
}
```

이 설정 때문에 브라우저 → Nginx 사이에서 요청이 차단되어 백엔드까지 도달하지 못함.

---

### ✅ 해결 방법

운영 환경에서 사용 중인 ECS 서비스 내에서 Nginx를 구동하고 있었고,
**Terraform 기반 설정 코드** 내부에서 `nginx.conf`를 동적으로 작성하는 구조였다.

아래와 같은 설정을 `infrastructure/Modules/ECS/main.tf` 파일 내에서 수정하여 해결하였다:

```terraform
command = [
  "/bin/sh",
  "-c",
  join("\n", [
    "cat <<'EOF' > /etc/nginx/nginx.conf",
    "events {}",
    "",
    "http {",
    "    server {",
    "            client_max_body_size 30M;", // 🔥 여기서 해결
    "        }",
    "    }",
    "EOF",
  ])
]
```

이 설정을 통해 Nginx가 부팅 시 `/etc/nginx/nginx.conf`를 동적으로 생성하면서
\*\*`client_max_body_size 30M;`\*\*가 적용되었고, 운영 환경에서도 정상적으로 이미지 업로드가 가능해졌다.

---

### 🧠 얻은 깨달음

* 시스템을 설계할 때는 \*\*단일 계층이 아닌 전체 흐름(프론트 → Nginx → 백엔드)\*\*을 고려해야 한다.
* \*\*네트워크 경로 중간의 설정(Nginx, 프록시, 로드밸런서)\*\*도 기능에 큰 영향을 줄 수 있다.
* 개발 환경과 운영 환경 사이의 **설정 차이**가 문제로 이어질 수 있다는 사실을 체감했다.
* 기능 구현뿐만 아니라, **인프라 이해도 또한 개발자의 책임 영역**이다.
* Terraform과 같은 IaC(Infrastructure as Code) 도구로 Nginx 설정을 동적으로 구성할 경우,
  꼭 필요한 설정이 누락되지 않도록 주의가 필요하다.

---

### 🎯 앞으로의 실천 항목

* 로컬에서 동작한다고 안심하지 않기 → **운영 환경 구성요소까지 시야 확장하기**
* 배포 전 체크리스트에 **Nginx, AWS S3, 인증 서버 등 중간 계층 설정**을 포함할 것
* 발생한 문제를 잘 정리하여 **문서화 및 팀 공유**로 동일한 실수를 방지할 것


