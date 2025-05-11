import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService } from '@/services/groupService';
import { toast } from 'react-toastify';
import { useLoadingStore } from '@/stores/loadingStore';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';

const GroupInvitePage = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinGroup = async () => {
      if (!inviteToken) {
        setError('유효하지 않은 초대 링크입니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        useLoadingStore.setState({ isLoading: true });

        // 그룹 참가 API 호출
        await groupService.joinGroupByInvite(inviteToken);

        toast.success('그룹에 성공적으로 참여했습니다!');

        // 참여 후 그룹 목록 페이지로 이동
        navigate('/group');
      } catch (error: any) {
        console.error('Failed to join group:', error);
        if (error && error.message) {
          setError(error.message);
          toast.error(error.message);
        } else {
          setError('그룹 참여에 실패했습니다. 다시 시도해주세요.');
          toast.error('그룹 참여에 실패했습니다.');
        }
        setLoading(false);
        useLoadingStore.setState({ isLoading: false });
      }
    };

    joinGroup();
  }, [inviteToken, navigate]);

  // 로딩 중이거나 에러가 없으면 로딩 스피너 표시
  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <PageLoadingSpinner />
        <p className="mt-4 text-gray-600">그룹에 참여하는 중입니다...</p>
      </div>
    );
  }

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <div className="min-h-screen bg-base-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto bg-primary-bg rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-base-foreground">
              유효하지 않은 코드입니다
            </h1>
            <p className="text-base-foreground/70">{error}</p>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={() => navigate('/group')}
              className="w-full px-4 py-2 text-base-white bg-primary hover:bg-primary-dark transition-colors rounded-lg shadow-sm"
            >
              그룹 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GroupInvitePage;
