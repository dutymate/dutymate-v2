package net.dutymate.api.domain.common.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import net.dutymate.api.domain.member.util.StringGenerator;

public class FileNameUtils {

	private static final DateTimeFormatter DATE_FOLDER_FORMAT = DateTimeFormatter.ofPattern("yyyy_MM");
	private static final DateTimeFormatter DATE_FILE_FORMAT = DateTimeFormatter.ofPattern("yyyy_MM_dd");
	private static final Integer RAND_STR_LENGTH = 6;

	// 파일명을 난수화하기 위해 UUID 활용
	public static String createFileName(String fileName, String dirName) {
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String extension = getFileExtension(fileName);
		return dirName + "/" + uuid + extension;
	}

	public static String getFileExtension(String fileName) {
		if (fileName == null || !fileName.contains(".")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일입니다.");
		}
		return fileName.substring(fileName.lastIndexOf("."));
	}

	/**
	 * 월별 디렉토리 + 날짜 기반 유니크 파일명 생성
	 * 예: logs/login/2025_05/2025_05_16_A9c2c3.csv
	 */
	public static String generateLoginLogFileName(LocalDate baseDate) {
		String folder = baseDate.format(DATE_FOLDER_FORMAT); // 2025_05
		String date = baseDate.format(DATE_FILE_FORMAT); // 2025_05_16
		String rand = StringGenerator.generateRandomString(RAND_STR_LENGTH); // A9c2c3

		return String.format("logs/login/%s/%s_%s.csv", folder, date, rand);
	}
}
