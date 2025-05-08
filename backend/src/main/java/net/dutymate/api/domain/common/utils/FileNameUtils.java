package net.dutymate.api.domain.common.utils;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class FileNameUtils {

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
}
