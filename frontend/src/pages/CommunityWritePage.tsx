import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import CommunityLayout from '@/components/organisms/CommunityLayout';
import CommunityWrite from '@/components/organisms/CommunityWrite';
import { SEO } from '@/components/SEO';
import boardService, { ApiErrorResponse } from '@/services/boardService';

interface WritePageInitialData {
  boardId: number;
  category: string;
  title: string;
  content: string;
  boardImgUrl?: string | null;
}

const CommunityWritePage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<WritePageInitialData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (boardId) {
        setIsLoading(true);
        try {
          const numericBoardId = parseInt(boardId, 10);
          if (isNaN(numericBoardId)) {
            toast.error('잘못된 게시글 ID입니다.');
            navigate('/community', { replace: true });
            return;
          }

          const response: WritePageInitialData =
            await boardService.getSinglePosts(numericBoardId);
          if (response) {
            setInitialData(response);
          } else {
            toast.error('게시글 정보를 불러오지 못했습니다.');
            navigate('/community', { replace: true });
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          toast.error(
            apiError?.message || '게시글 정보를 가져오는데 실패했습니다.'
          );
          navigate('/community', { replace: true });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [boardId, navigate]);

  const isEditMode = Boolean(boardId);

  if (isEditMode && isLoading) {
    return (
      <CommunityLayout title="글 수정" subtitle="게시글을 불러오는 중입니다...">
        <div className="flex justify-center items-center py-10">
          <PageLoadingSpinner />
        </div>
      </CommunityLayout>
    );
  }

  if (isEditMode && !initialData && !isLoading) {
    return (
      <CommunityLayout title="오류" subtitle="게시글 조회 실패">
        <p className="text-center py-10">
          요청하신 게시글을 찾을 수 없거나 불러오는 데 실패했습니다.
        </p>
      </CommunityLayout>
    );
  }

  return (
    <>
      <SEO
        title="글쓰기 | Dutymate 커뮤니티"
        description="동료 간호사들과 나누고 싶은 이야기를 작성해보세요."
      />
      <CommunityLayout
        title={isEditMode ? '글 수정' : '글쓰기'}
        subtitle={
          isEditMode
            ? '게시글을 수정해보세요'
            : '동료들과 나누고 싶은 이야기를 작성해보세요'
        }
      >
        {(!isEditMode || (isEditMode && initialData)) && (
          <CommunityWrite
            initialData={
              initialData
                ? {
                    ...initialData,
                    boardImgUrl:
                      initialData.boardImgUrl === null
                        ? undefined
                        : initialData.boardImgUrl,
                  }
                : undefined
            }
            isEditMode={isEditMode}
          />
        )}
      </CommunityLayout>
    </>
  );
};

export default CommunityWritePage;
