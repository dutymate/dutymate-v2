package net.dutymate.api.domain.member.util;

import java.security.SecureRandom;
import java.util.Random;

public class StringGenerator {
	// 형용사 배열
	private static final String[] adjectives = {
		"귀여운", "발랄한", "사랑스런", "똑똑한", "활발한", "졸린", "쑥스러운", "용감한", "상냥한", "행복한",
		"느긋한", "온화한", "믿음직한", "애교많은", "재밌는", "엉뚱한", "당당한", "재빠른", "고요한", "부드러운"
	};

	// 동물 이름 배열
	private static final String[] animals = {
		"강아지", "고양이", "햄스터", "토끼", "앵무새", "거북이", "고슴도치", "말티즈", "푸들", "치와와",
		"코끼리", "페르시안", "스피츠", "호랑이", "돌고래", "코뉴어", "페럿", "다람쥐", "이구아나", "비글"
	};

	private static final String UPPER_LOWER_NUM_CHARS
		= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	private static final String UPPER_NUM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	private static final int LENGTH = 15;
	private static final SecureRandom random = new SecureRandom();

	// 랜덤 닉네임 생성 함수
	public static String generateNickname() {
		Random random = new Random();

		// 배열의 길이에 맞춰 랜덤으로 배열 값을 조회
		String adjective = adjectives[random.nextInt(adjectives.length)];
		String animal = animals[random.nextInt(animals.length)];
		// 추가적으로 닉네임 중복을 방지하기 위해 1~99까지의 무작위 숫자 조회
		int number = random.nextInt(99) + 1;

		return adjective + animal + number;
	}

	public static String generateRandomString() {
		StringBuilder sb = new StringBuilder(LENGTH);
		for (int i = 0; i < LENGTH; i++) {
			int index = random.nextInt(UPPER_LOWER_NUM_CHARS.length());
			sb.append(UPPER_LOWER_NUM_CHARS.charAt(index));
		}
		return sb.toString();
	}

	// wardCode : 랜덤한 6자리 대문자 + 숫자 조합 코드 생성
	public static String generateWardCode() {
		Random random = new Random();
		StringBuilder code = new StringBuilder();
		int wardCodeLength = 6;
		while (wardCodeLength-- > 0) {
			code.append(UPPER_NUM_CHARS.charAt(random.nextInt(UPPER_NUM_CHARS.length())));
		}
		return code.toString();
	}
}
