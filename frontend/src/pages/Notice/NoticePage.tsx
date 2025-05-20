//공지사항 목록
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
// import axiosInstance from '@/lib/axios';

// import { Button } from '@/components/atoms/Button';
import { SEO } from '@/components/SEO';

interface Notice {
  noticeId: number;
  title: string;
  createdAt: string;
  content: string;
  isPinned: boolean;
}

const NOTICES_PER_PAGE = 5;

const NoticePage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: 실제 관리자 여부로 교체 (예: userInfo.role === 'admin')
  // const isAdmin = true;

  useEffect(() => {
    // API 호출 대신 더미 데이터 사용
    setNotices([
      {
        noticeId: 4,
        title: '📢 듀티메이트 Ver.2.4.0 출시 안내',
        createdAt: '2025-02-15T09:00:00.000Z',
        content: `안녕하세요! 듀티메이트의 새로운 업데이트 소식을 전해드립니다.

1. 평간호사님, 이제 듀티표 직접 관리하세요 ✨
• 병동 입장 없이도 나의 듀티표 등록 가능
• 터치 한 번으로 근무 등록
• 근무별 색상 커스텀 설정
• 개인 일정도 함께 기록 가능

2. 친구와 근무표 공유도 간편하게 👥
• 동료와 근무표 공유
• 모두 쉴 수 있는 날짜 자동 추천

3. 자동 생성 기능이 더 똑똑해졌어요 🤖💡
• 공휴일 및 임시공휴일 자동 반영
• 반려된 요청 우선 반영
• 근무 강도 및 Off 일수 설정 가능
• 수간호사가 대신 요청 등록 가능

📩 궁금한 점은 우측 하단 채널톡으로 편하게 문의 주세요! 😊`,
        isPinned: true,
      },
      {
        noticeId: 1,
        title: '서비스 이용 안내',
        createdAt: '2025-02-15T09:00:00.000Z',
        content:
          '듀티메이트 서비스 이용 안내입니다.\n\n1. 서비스 이용 방법\n2. 주요 기능 소개\n3. 자주 묻는 질문',
        isPinned: false,
      },
      {
        noticeId: 2,
        title: '개인정보 처리방침',
        createdAt: '2025-02-15T09:00:00.000Z',
        content:
          '듀티메이트 개인정보 처리방침입니다.\n\n1. 수집하는 개인정보 항목\n2. 개인정보의 수집 및 이용목적\n3. 개인정보의 보유 및 이용기간\n4. 개인정보의 제3자 제공',
        isPinned: false,
      },
      {
        noticeId: 3,
        title: '이용약관',
        createdAt: '2025-02-15T09:00:00.000Z',
        content:
          '듀티메이트 이용약관입니다.\n\n1. 서비스 이용 조건\n2. 회원의 의무\n3. 서비스 제공자의 의무\n4. 기타 규정',
        isPinned: false,
      },
    ]);
    setLoading(false);
  }, []);

  // 안전한 페이지네이션 계산
  const safeNotices = Array.isArray(notices) ? notices : [];
  const totalPages = Math.max(
    1,
    Math.ceil(safeNotices.length / NOTICES_PER_PAGE)
  );

  // 현재 페이지가 유효한지 확인하고 필요한 경우 조정
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedNotices = safeNotices.slice(
    (currentPage - 1) * NOTICES_PER_PAGE,
    currentPage * NOTICES_PER_PAGE
  );

  const handleBackClick = () => {
    navigate(-1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // const handleWriteClick = () => {
  //   navigate('/notice/write');
  // };

  // 공지사항 목록 새로고침
  const handleRefresh = () => {
    // fetchNotices();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-2 text-center">로딩 중...</div>
    );
  }

  return (
    <>
      <SEO
        title="공지사항 | Dutymate"
        description="듀티메이트의 최신 소식과 공지사항을 확인하세요."
      />
      <div className="container mx-auto px-4 py-2">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="relative mb-6 h-16 flex items-center justify-center">
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-gray-700 hover:text-primary sm:w-10 sm:h-10"
              onClick={handleBackClick}
              aria-label="뒤로가기"
            >
              <FaChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mx-auto">
              공지사항
            </h1>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
              {/* {isAdmin && (
                // <Button
                //   color="primary"
                //   size="sm"
                //   className="h-8 px-2 text-xs sm:h-9 sm:px-4 sm:text-sm flex items-center justify-center"
                //   onClick={handleWriteClick}
                // >
                //   글쓰기
                // </Button>
              )} */}
            </div>
          </div>

          {/* 공지사항 목록 */}
          <>
            <div className="space-y-4 pb-20">
              {paginatedNotices.length > 0 ? (
                paginatedNotices.map((notice) => (
                  <div
                    key={notice.noticeId}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative"
                    onClick={() => navigate(`/notice/${notice.noticeId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden flex-nowrap">
                        {notice.isPinned && (
                          <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded whitespace-nowrap">
                            중요
                          </span>
                        )}
                        <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate flex-1 min-w-0">
                          {notice.title}
                        </h2>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                  <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                  <button
                    className="mt-2 text-primary hover:underline text-sm"
                    onClick={handleRefresh}
                  >
                    새로고침
                  </button>
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div
                className="fixed left-0 bottom-0 lg:relative lg:bottom-auto w-full bg-white border-t border-gray-200 z-10 flex justify-center items-center gap-2 py-2
                lg:border-0 lg:shadow-none lg:rounded-none lg:py-4"
              >
                <button
                  className={`min-w-[2.5rem] h-8 text-xs px-2 flex items-center justify-center rounded transition-colors
                    ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="이전 페이지"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={`min-w-[2rem] h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors px-0.5 sm:text-sm sm:min-w-[2.5rem] sm:h-8
                        ${
                          currentPage === page
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }
                      `}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  className={`min-w-[2.5rem] h-8 text-xs px-2 flex items-center justify-center rounded transition-colors
                    ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="다음 페이지"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default NoticePage;
