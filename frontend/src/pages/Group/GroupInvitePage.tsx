import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService } from '@/services/groupService';
import { toast } from 'react-toastify';
import { useLoadingStore } from '@/stores/loadingStore';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import { Helmet } from 'react-helmet-async';

const GroupInvitePage = () => {
  const navigate = useNavigate();
  const { inviteToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);

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
        const response = await groupService.joinGroupByInvite(inviteToken);
        if (response && response.groupName) {
          setGroupName(response.groupName);
        }

        // 로컬 스토리지에서 inviteToken 제거
        localStorage.removeItem('inviteToken');

        toast.success('그룹에 성공적으로 참여했습니다!');
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
      } finally {
        setLoading(false);
        useLoadingStore.setState({ isLoading: false });
      }
    };

    joinGroup();
  }, [inviteToken, navigate]);

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const currentUrl = `${baseUrl}/invite/${inviteToken}`;
  const imageUrl = `${baseUrl}/images/og-image.png`;

  return (
    <>
      <Helmet>
        <title>
          {groupName ? `${groupName} 그룹 초대` : '듀티메이트 - 그룹 초대'}
        </title>
        <meta
          name="description"
          content="DutyMate에서 함께 근무표를 관리하고 일정을 공유해보세요!"
        />

        {/* OpenGraph Meta Tags */}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={
            groupName ? `${groupName} 그룹 초대` : '듀티메이트 - 그룹 초대'
          }
        />
        <meta
          property="og:description"
          content="DutyMate에서 함께 근무표를 관리하고 일정을 공유해보세요!"
        />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="듀티메이트" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={
            groupName ? `${groupName} 그룹 초대` : '듀티메이트 - 그룹 초대'
          }
        />
        <meta
          name="twitter:description"
          content="DutyMate에서 함께 근무표를 관리하고 일정을 공유해보세요!"
        />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>

      {/* 로딩 상태일 때는 Helmet만 렌더링 */}
      {loading && !error ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <PageLoadingSpinner />
          <p className="mt-4 text-gray-600">그룹에 참여하는 중입니다...</p>
        </div>
      ) : error ? (
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
      ) : null}
    </>
  );
};

export default GroupInvitePage;
