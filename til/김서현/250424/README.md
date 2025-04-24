# Today I Learned

> 2025년 04월 23일

1. 모든 페이지에 적용시키려면 atoms폴더에 넣고 임포트하는 방식을 취한다 

2. 타이머의 숫자가 줄어들 때마다 상자가 움직였던 이유는 width의 값이 고정되지 않아서 였다. 

   w-[width] 클래스를 이용해서 고정 너비를 설정한다. 

3. 다크모드 
	3-1. tailwind.config.js 설정

	module.exports = {
  	darkMode: "class", // ✅ 다크모드 수동 전환 방식 설정
 	 content: ["./src/**/*.{js,jsx,ts,tsx}"],
  	theme: {
   	 extend: {
      // 색상, 폰트 등 설정 생략
  	  },
 	 },
	  plugins: [],
	};
	```
	darkMode:"class"설정은 html요소에 class="dark"가 붙으면 적용되도록 만든다.


	3-2. DarkModeToggle.tsx 컴포넌트 생성성


	3-3. 전역 index.css  스타일 보완 (기본 다크 배경)
	```
		@layer base {
	html {
		font-family: "Pretendard", system-ui, sans-serif;
		background-color: white;
	}

	.dark html {
		background-color: #1a1a1a; /* ✅ 다크 배경 */
	}
	}
	```


	3-4. 실제 적용: 페이지 컴포넌트에 dark: 클래스 붙이기
	<div className="bg-white text-black dark:bg-[#1a1a1a] dark:text-white">
	...
	</div>




