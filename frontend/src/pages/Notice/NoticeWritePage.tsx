// 공지사항 글쓰기
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { Button } from '@/components/atoms/Button';
import { SEO } from '@/components/SEO';
import { FaChevronLeft } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import axiosInstance from '../../lib/axios';

const NoticeWritePage = () => {
  const navigate = useNavigate();
  const { noticeId } = useParams(); // URL에서 noticeId 파라미터 가져오기
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!noticeId; // noticeId가 있으면 수정 모드

  // 수정 모드일 경우 기존 데이터 불러오기
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      // fetchNoticeData();
    }
  }, [noticeId, isEditMode]);

  // const fetchNoticeData = async () => {
  //   try {
  //     const response = await axiosInstance.get(`/api/notice/${noticeId}`);
  //     const noticeData = response.data;

  //     setTitle(noticeData.title || '');
  //     setContent(noticeData.content || '');
  //     setIsPinned(Boolean(noticeData.isPinned));
  //   } catch (error) {
  //     console.error('공지사항 데이터 로딩 실패:', error);
  //     alert('공지사항 데이터를 불러오는데 실패했습니다.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    // const noticeData = {
    //   title: title.trim(),
    //   content: content.trim(),
    //   isPinned,
    // };

    setLoading(true);
    try {
      if (isEditMode) {
        // 수정 모드: PUT 요청
        // await axiosInstance.put(`/api/notice/${noticeId}`, noticeData);
        alert('공지사항이 수정되었습니다.');
      } else {
        // 등록 모드: POST 요청
        // await axiosInstance.post('/api/notice', noticeData);
        alert('공지사항이 등록되었습니다.');
      }
      navigate('/notice');
    } catch (err) {
      console.error('공지사항 저장 실패:', err);
      alert(
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
              <label
                htmlFor="notice-title"
                className="text-base font-semibold text-black mb-1 block"
              >
                제목
              </label>
              <input
                id="notice-title"
                type="text"
                className="w-full border rounded px-3 py-2 text-base focus:outline-primary"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="notice-content"
                className="text-base font-semibold text-black mb-1 block"
              >
                내용
              </label>
              <ReactQuill
                id="notice-content"
                value={content}
                onChange={setContent}
                className="mb-6 w-full min-w-0 overflow-x-auto custom-quill-editor"
                style={{ minHeight: '15.625rem' }}
                placeholder="내용을 입력하세요"
              />
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
              {/* <Button
                type="button"
                color="muted"
                size="md"
                className="w-[200px] h-[3rem] sm:h-10"
                onClick={() => navigate(-1)}
              >
                취소
              </Button>
              <Button
                type="submit"
                color="primary"
                size="md"
                className="w-[200px] h-[3rem] sm:h-10"
                disabled={loading}
              >
                {isEditMode ? '수정' : '등록'}
              </Button> */}
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
        `}
      </style>
    </>
  );
};

export default NoticeWritePage;
