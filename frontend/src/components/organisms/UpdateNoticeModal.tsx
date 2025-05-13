import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface UpdateNoticeModalProps {
  onClose: () => void;
  onDoNotShowToday: () => void;
  markdownPath?: string;
}

const UpdateNoticeModal = ({
  onClose,
  onDoNotShowToday,
  markdownPath = '/updateNotice.md', // Default markdown file path
}: UpdateNoticeModalProps) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMarkdownContent = async () => {
      try {
        const response = await axios.get(markdownPath);
        setMarkdownContent(response.data);
      } catch (error) {
        console.error('Failed to fetch markdown content:', error);
        setMarkdownContent('# 업데이트 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdownContent();
  }, [markdownPath]);

  // 바깥 클릭 막기 위해 stopPropagation만 처리
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // ReactMarkdown 컴포넌트를 위한 커스텀 렌더러
  const customComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-center pr-6"
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-sm sm:text-base font-semibold mt-4 mb-2" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-xs sm:text-sm font-semibold mt-3 mb-1" {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p className="text-xs sm:text-sm my-2" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className="list-disc pl-4 sm:pl-5 mb-3 text-xs sm:text-sm"
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li className="text-xs sm:text-sm mb-1" {...props} />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold" {...props} />
    ),
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 min-h-screen py-6 px-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-lg flex flex-col gap-3 max-h-[80vh] relative mx-2"
        onClick={handleOverlayClick}
      >
        {/* 상단 닫기 버튼 추가 - 모바일 접근성 향상 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 z-10"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto text-left p-3 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>업데이트 정보를 불러오는 중...</p>
            </div>
          ) : (
            <div className="text-gray-800">
              <ReactMarkdown components={customComponents}>
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-3 sm:p-6 pt-0 sm:pt-0">
          <button
            className="flex-1 py-1.5 sm:py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold text-xs sm:text-base"
            onClick={onDoNotShowToday}
          >
            오늘 보지 않기
          </button>
          <button
            className="flex-1 py-1.5 sm:py-2 rounded-lg bg-primary text-white font-semibold text-xs sm:text-base"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdateNoticeModal;
