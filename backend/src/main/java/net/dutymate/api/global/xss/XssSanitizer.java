package net.dutymate.api.global.xss;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class XssSanitizer {

	/**
	 * 게시글 내용에서 위험한 스크립트 및 태그 제거
	 * @param input 사용자 입력 문자열
	 * @return 안전한 문자열
	 */
	public static String clean(String input) {
		if (input == null) {
			return null;
		}

		// Safelist.basic()은 <b>, <i>, <ul>, <a> 등 기본적인 HTML만 허용
		return Jsoup.clean(input, Safelist.basic());
	}
}
