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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/group')}
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold"
          >
            그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GroupInvitePage;
