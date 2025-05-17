package net.dutymate.api.domain.member.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.common.utils.FileNameUtils;
import net.dutymate.api.domain.member.dto.LoginLog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class LoginLogService {

	private final StringRedisTemplate redisTemplate;
	private final ObjectMapper objectMapper;
	private final S3Client s3Client;

	@Value("${cloud.aws.region.static}")
	private String region;
	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	// 어제 날짜 기준으로 작성된 로그인 기록을 S3 저장
	public String batchLoginLogs() {
		LocalDate date = LocalDate.now().minusDays(1); // 어제 날짜 기준
		String key = "logs:login:" + date;

		// Redis에서 어제 날짜로 불러오기
		List<LoginLog> logs = new ArrayList<>();
		while (true) {
			String json = redisTemplate.opsForList().leftPop(key);
			if (json == null) {
				break;
			}

			try {
				logs.add(objectMapper.readValue(json, LoginLog.class));
			} catch (JsonProcessingException ignored) { // JSON 파싱 예외시 무시
			}
		}

		// S3 업로드 및 다운로드 링크 반환
		String uploadedUrl = null;
		if (!logs.isEmpty()) {
			try {
				uploadedUrl = uploadCsvLog(logs, date);
			} catch (IOException e) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 업로드 중 오류가 발생했습니다.");
			}
		}

		// 업로드 완료된 경우, Redis 키 수동 삭제
		redisTemplate.delete(key);

		return uploadedUrl;
	}

	// 로그인 로그를 Redis에 오늘 날짜로 저장
	public void pushLoginLog(LoginLog log) {
		try {
			String today = LocalDate.now().toString();
			String key = "logs:login:" + today;

			String json = objectMapper.writeValueAsString(log);
			redisTemplate.opsForList().rightPush(key, json);

			// TTL 2일 설정 (업로드 실패 대비, 2일동안 저장)
			redisTemplate.expire(key, Duration.ofDays(2));
		} catch (JsonProcessingException ignored) { // JSON 파싱 예외시 무시
		}
	}

	// List<LoingLog> logs -> CSV 변환 및 S3 업로드
	private String uploadCsvLog(List<LoginLog> logs, LocalDate date) throws IOException {
		String fileName = FileNameUtils.generateLoginLogFileName(date);

		StringBuilder csvBuilder = new StringBuilder();
		csvBuilder.append("memberId,loginAt,createdAt,success,failReason\n");

		for (LoginLog log : logs) {
			csvBuilder.append(String.format("\"%s\",\"%s\",\"%s\",%s,\"%s\"\n",
				nullToEmpty(log.getMemberId()),
				nullToEmpty(log.getLoginAt()),
				nullToEmpty(log.getCreatedAt()),
				log.isSuccess(),
				nullToEmpty(log.getFailReason())
			));
		}

		byte[] bom = {(byte)0xEF, (byte)0xBB, (byte)0xBF}; // UTF-8 BOM
		byte[] data = csvBuilder.toString().getBytes(StandardCharsets.UTF_8);

		// BOM + CSV 내용 합치기
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		outputStream.write(bom);
		outputStream.write(data);

		ByteArrayInputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());

		PutObjectRequest request = PutObjectRequest.builder()
			.bucket(bucket)
			.key(fileName)
			.contentType("text/csv")
			.build();

		s3Client.putObject(request, RequestBody.fromInputStream(inputStream, outputStream.size()));

		return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + fileName;
	}

	private String nullToEmpty(String input) {
		return input == null ? "" : input.replace("\"", "'");
	}
}
