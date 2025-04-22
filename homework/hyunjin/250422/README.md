# TIL
 날짜 : 2025-04-22 (화)

 <br>

## 이메일 인증 기능을 구현하라
### 1. GOOGLE SMTP 설정하기


### 2. 이메일로 인증 코드 보내기

2-1) 이메일로 인증 코드 보내기
- 6자리의 숫자 랜덤 코드 만들기
- 숫자코드를 담아서 메일로 message 보내기

<br>

메세지를 보내기 위해서는 text만 보내는 방식과 html 코드로 보내는 방식이 있다. 


첫 번째로 텍스트로만 메세지를 보내는 방법이 존재한다.

`SimpleMailMessage`를 활용하면 텍스트를 담아서 메일을 보낸다. 

```java
SimpleMailMessage message = new SimpleMailMessage();

message.setTo(email);
message.setSubject(TITLE);
message.setText(text);
```






### 3. 인증 코드 유효성 검사하기 