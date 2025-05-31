// 공지사항 글쓰기
import { useState, useEffect, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { FaChevronLeft } from 'react-icons/fa';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useUserAuthStore } from '../../stores/userAuthStore';
import axiosInstance from '../../lib/axios';
import { toast } from 'react-toastify';

const NoticeWritePage = () => {
  const navigate = useNavigate();
  const { noticeId } = useParams(); // URL에서 noticeId 파라미터 가져오기
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!noticeId; // noticeId가 있으면 수정 모드
  const token = useUserAuthStore((state) => state.userInfo?.token);
  const email = useUserAuthStore((state) => state.userInfo?.email);

  // 글자 수 제한 상수
  const TITLE_MAX_LENGTH = 40;
  const CONTENT_MAX_LENGTH = 2000;

  // HTML 태그를 제거하고 실제 텍스트 길이를 계산하는 함수 (공백 제외)
  const getTextLength = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.replace(/\s/g, '').length; // 공백 제거 후 길이
  };

  // 일반 텍스트에서 공백 제거 후 길이 계산
  const getTitleTextLength = (text: string) => {
    return text.replace(/\s/g, '').length; // 공백 제거 후 길이
  };

  // 실제 텍스트 길이
  const contentTextLength = getTextLength(content);
  const titleTextLength = getTitleTextLength(title);

  // 수정 모더일 경우 기존 데이터 불러오기

  //로그인하지 않은 사용자 차단 , 관리자 이메일이 아니면 차단
  useEffect(() => {
    if (!token || email !== 'dutymate.net@gmail.com') {
      navigate('/notice');
    }
  }, [token, email]);

  const fetchNoticeData = async () => {
    try {
      const response = await axiosInstance.get(`/notice/${noticeId}`);
      const noticeData = response.data;

      setTitle(noticeData.title || '');
      setContent(noticeData.content || '');
      setIsPinned(Boolean(noticeData.isPinned));
    } catch (error) {
      console.error('공지사항 데이터 로딩 실패:', error);
      toast.error('공지사항 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      fetchNoticeData();
    }
  }, [noticeId, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warn('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      toast.warn('내용을 입력해주세요.');
      return;
    }

    // 글자 수 제한 검증
    if (titleTextLength > TITLE_MAX_LENGTH) {
      toast.warn(`제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요.`);
      return;
    }

    if (contentTextLength > CONTENT_MAX_LENGTH) {
      toast.warn(`내용은 ${CONTENT_MAX_LENGTH}자 이내로 입력해주세요.`);
      return;
    }

    const sanitizeHtml = (html: string) => {
      return html
        .replace(/<script.*?>.*?<\/script>/gi, '') // <script> 태그 제거
        .replace(/on\w+=".*?"/gi, '') // onClick, onError 등 이벤트 핸들러 제거
        .replace(/javascript:/gi, ''); // javascript: 링크 제거
    };

    const cleanContent = sanitizeHtml(content);

    const noticeData = {
      title: title.trim(),
      content: cleanContent, //필터링된 내용 사용용
      isPinned,
    };

    const ReactQuillWrapper = forwardRef<ReactQuill, ReactQuillProps>(
      (props, ref) => <ReactQuill {...props} ref={ref} />
    );
    ReactQuillWrapper.displayName = 'ReactQuillWrapper';

    setLoading(true);
    try {
      if (isEditMode) {
        // 수정 모드: PUT 요청
        await axiosInstance.put(`/notice/${noticeId}`, noticeData);
        toast.success('공지사항이 수정되었습니다.');
      } else {
        // 등록 모드: POST 요청
        await axiosInstance.post('/notice', noticeData);
        toast.success('공지사항이 등록되었습니다.');
      }
      navigate('/notice');
    } catch (err) {
      console.error('공지사항 저장 실패:', err);
      toast.error(
        isEditMode
          ? '공지사항 수정에 실패했습니다.'
          : '공지사항 등록에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">로딩 중...</div>
    );
  }

  return (
    <>
      <SEO
        title={
          isEditMode ? '공지사항 수정 | Dutymate' : '공지사항 작성 | Dutymate'
        }
        description={
          isEditMode ? '공지사항을 수정하세요.' : '공지사항을 작성하세요.'
        }
      />
      <div className="container mx-auto px-4 py-2 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative h-16 flex items-center justify-center mb-6">
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-gray-700 hover:text-primary sm:w-10 sm:h-10"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <FaChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mx-auto">
              {isEditMode ? '공지사항 수정' : '공지사항 작성'}
            </h1>
          </div>

          <form
            id="notice-form"
            className="flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            onSubmit={handleSubmit}
          >
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="notice-title"
                  className="text-base font-semibold text-black"
                >
                  제목
                </label>
                <span
                  className={`text-sm ${titleTextLength > TITLE_MAX_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {titleTextLength}/{TITLE_MAX_LENGTH}
                </span>
              </div>
              <input
                id="notice-title"
                type="text"
                autoComplete="off"
                className={`w-full border rounded px-3 py-2 text-base rounded-lg focus:outline-none ${
                  titleTextLength > TITLE_MAX_LENGTH ? 'border-red-500' : ''
                }`}
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {titleTextLength > TITLE_MAX_LENGTH && (
                <p className="text-red-500 text-sm mt-1">
                  제목은 {TITLE_MAX_LENGTH}자 이내로 입력해주세요.
                </p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="notice-content"
                  className="text-base font-semibold text-black"
                >
                  내용
                </label>
                <span
                  className={`text-sm ${contentTextLength > CONTENT_MAX_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {contentTextLength}/{CONTENT_MAX_LENGTH}
                </span>
              </div>
              <ReactQuill
                id="notice-content"
                value={content}
                onChange={setContent}
                className={`w-full min-w-0 overflow-x-auto custom-quill-editor rounded-lg ${
                  contentTextLength > CONTENT_MAX_LENGTH ? 'quill-error' : ''
                }`}
                style={{ minHeight: '15.625rem' }}
                placeholder="내용을 입력하세요"
              />
              {contentTextLength > CONTENT_MAX_LENGTH && (
                <p className="text-red-500 text-sm mt-1">
                  내용은 {CONTENT_MAX_LENGTH}자 이내로 입력해주세요.
                </p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="accent-primary w-4 h-4"
                  id="important-checkbox"
                />
                <label
                  htmlFor="important-checkbox"
                  className="text-base font-semibold text-black"
                >
                  중요 공지사항으로 표시
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-6">
                중요 공지사항은 목록 상단에 표시됩니다.
              </p>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                className="flex items-center justify-center gap-1 px-6 py-2 sm:px-8 sm:py-2
                 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm
                 text-sm sm:text-base text-gray-700"
                onClick={() => navigate(-1)}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-1 px-6 py-2 sm:px-8 sm:py-2
                 bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm
                 text-sm sm:text-base text-white"
                disabled={
                  loading ||
                  titleTextLength > TITLE_MAX_LENGTH ||
                  contentTextLength > CONTENT_MAX_LENGTH
                }
              >
                {isEditMode ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>
        {`
          .custom-quill-editor .ql-container {
            min-height: 15.625rem;
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
          @media (min-width: 640px) {
            .custom-quill-editor .ql-container {
              min-height: 21.875rem;
            }
          }
          .custom-quill-editor .ql-toolbar {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            border-color: #e5e7eb;
          }
          .custom-quill-editor .ql-container {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            border-color: #e5e7eb;
          }
          .custom-quill-editor .ql-editor.ql-blank::before {
            font-style: normal !important;
            color: #9ca3af !important;
            font-size: 1rem !important;
          }
          .quill-error .ql-container {
            border-color: #ef4444 !important;
          }
          .quill-error .ql-toolbar {
            border-color: #ef4444 !important;
          }
        `}
      </style>
    </>
  );
};

export default NoticeWritePage;
