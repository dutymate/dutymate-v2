package net.dutymate.api.domain.common.service;

import static net.dutymate.api.domain.common.utils.FileNameUtils.*;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class S3Service {

	private final S3Client s3Client;

	@Value("${cloud.aws.region.static}")
	private String region;
	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	public String uploadImage(String dirName, MultipartFile multipartFile) {
		if (multipartFile == null || multipartFile.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일이 비어 있습니다.");
		}

		String originalFilename = multipartFile.getOriginalFilename();
		String contentType = multipartFile.getContentType();

		if (!isImageFile(contentType, originalFilename)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지 파일만 업로드할 수 있습니다.");
		}

		try {
			byte[] imageBytes;
			String fileExtension;

			if (isHeicFile(contentType, originalFilename)) {
				BufferedImage bufferedImage = ImageIO.read(multipartFile.getInputStream());

				if (bufferedImage == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HEIC 파일을 읽을 수 없습니다.");
				}

				ByteArrayOutputStream os = new ByteArrayOutputStream();
				ImageIO.write(bufferedImage, "jpg", os); // jpg로 변환
				imageBytes = os.toByteArray();
				fileExtension = "jpg";
			} else {
				imageBytes = multipartFile.getBytes();
				fileExtension = getFileExtension(originalFilename);
			}

			String fileName = createFileName(dirName, fileExtension);
			System.out.println("fileName = " + fileName);

			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucket)
				.key(fileName)
				.contentType("image/" + fileExtension)
				.build();

			s3Client.putObject(putObjectRequest, RequestBody.fromBytes(imageBytes));

			return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + fileName;
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 업로드 중 오류가 발생했습니다.");
		}
	}

	public void deleteFile(String dirName, String fileName) {
		String key = dirName + "/" + fileName;

		try {
			DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
				.bucket(bucket)
				.key(key)
				.build();

			s3Client.deleteObject(deleteObjectRequest);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 이미지 삭제 중 오류 발생");
		}
	}

	public String extractFileNameFromUrl(String fileUrl, String dirName) {
		String baseUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + dirName;
		return fileUrl.replace(baseUrl, "");
	}

	// 기본 프로필 이미지 URL 생성
	public String addBasicProfileImgUrl() {
		return "https://" + bucket + ".s3." + region + ".amazonaws.com/profile/default_profile.png";
	}
}
