package net.dutymate.api.member.util;

import java.util.Random;

public class NicknameGenerator {
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
}
