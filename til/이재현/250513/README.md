# Today I Learned

> 2025년 05월 13일 이재현

## React-Markdown 라이브러리 도입

### 배경

- 기존 하드코딩된 공지사항 내용을 마크다운 파일로 분리하여 관리하기로 결정
- 공지사항 내용 업데이트 시 코드 수정 없이 마크다운 파일만 수정하면 되도록 개선

### 구현 내용

1. react-markdown 라이브러리 설치 및 적용

   - 마크다운 문법을 React 컴포넌트로 렌더링
   - 커스텀 스타일링을 위한 컴포넌트 오버라이딩
     ```typescript
     const customComponents = {
       h1: ({ node, ...props }) => (
         <h1
           className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-center pr-6"
           {...props}
         />
       ),
       // ... 기타 컴포넌트 스타일링
     };
     ```

2. 공지사항 마크다운 파일 분리

   - 위치: `/public/updateNotice.md`
   - V2.3.0 기준으로 최신화된 내용 반영
     - 평간호사 기능 대폭 추가
     - 근무표 관리 및 공유 기능 개선
     - 자동 생성 기능 강화
   - 마크다운 문법을 활용한 구조화된 문서 작성
     - 제목 계층 구조 (h1, h2, h3)
     - 강조 표시 (bold, italic)
     - 리스트 및 구분선 활용

3. UpdateNoticeModal 컴포넌트 개선
   - axios를 사용하여 마크다운 파일 동적 로딩
     ```typescript
     const fetchMarkdownContent = async () => {
       try {
         const response = await axios.get(markdownPath);
         setMarkdownContent(response.data);
       } catch (error) {
         console.error('Failed to fetch markdown content:', error);
         setMarkdownContent('# 업데이트 정보를 불러오는 데 실패했습니다.');
       }
     };
     ```
   - 로딩 상태 처리
     - 초기 로딩 시 스피너 표시
     - 에러 발생 시 대체 메시지 표시
   - 반응형 디자인 적용
     - 모바일/데스크톱 환경에 따른 폰트 크기 조정
     - 스크롤 처리 및 여백 최적화

### 장점

- 공지사항 내용 관리 용이성 향상
  - 마크다운 에디터를 통한 쉬운 편집
  - 버전 관리 시스템을 통한 변경 이력 추적
- 마크다운 문법을 통한 구조화된 문서 작성 가능
  - 일관된 포맷팅
  - 가독성 향상
- 코드와 콘텐츠의 분리로 유지보수성 개선
  - 개발자와 기획자/디자이너의 역할 분리
  - 배포 프로세스 단순화
