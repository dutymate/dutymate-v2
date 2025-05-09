# Today I Learned

> 2025년 05월 09일

## 오늘의 장애 부검

프로덕션 서버에서 주기적으로 Mail health check failed 에러가 발생하고 있습니다.

```shell
2025-05-09T14:21:55.176+09:00 WARN 1 --- [nio-8080-exec-5] o.s.b.actuate.mail.MailHealthIndicator : Mail health check failed
2025-05-09T14:21:55.178+09:00 jakarta.mail.MessagingException: Exception reading response
2025-05-09T14:21:55.178+09:00 at org.eclipse.angus.mail.smtp.SMTPTransport.readServerResponse(SMTPTransport.java:2509) ~[jakarta.mail-2.0.3.jar:na]
```

이는 Spring Boot에서 주기적으로 메일 서버의 상태를 확인하는 과정에서 발생한 것입니다.
하지만 메일 서버의 상태는 정상이고, 이메일 인증 발송 기능은 정상 작동하고 있습니다.

### 해결 방법

메일 서버의 상태를 확인하는 과정에서 발생하는 에러이므로, 메일 서버의 상태를 확인하는 기능을 비활성화하면 됩니다.

```yaml
management:
  health:
    mail:
      enabled: false
```
