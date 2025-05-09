import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';

import EnterWardForm from '@/components/organisms/EnterWardForm';
import LandingTemplate from '@/components/templates/LandingTemplate';
import { SEO } from '@/components/SEO';
import { userService } from '@/services/userService';
import { wardService } from '@/services/wardService';
import useUserAuthStore from '@/stores/userAuthStore';
import WaitingForApproval from '@/components/organisms/WaitingForApproval';
import LoadingSpinner from '@/components/atoms/Loadingspinner';

const EnterWard = () => {
  const { userInfo } = useUserAuthStore();
  const navigate = useNavigate();
  const userAuthStore = useUserAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 한 번만 상태 확인
    checkWaitingStatus();
  }, []);

  const checkWaitingStatus = async () => {
    try {
      setIsLoading(true);

      // API 호출 결과 가져오기 (직접 boolean 값이 반환됨)
      const isWaiting = await userService.enterWaitingStatus();

      // 병동 소속 여부 최신 상태 확인 (API 호출)
      const isExistMyWard = await userService.existWardStatus();

      // 최신 사용자 정보 사용 (userInfo가 최신 상태)
      if (!userInfo) {
        setIsLoading(false);
        return;
      }

      // isWaiting 값에 따라 userInfo 업데이트
      if (
        userInfo.sentWardCode !== isWaiting ||
        userInfo.existMyWard !== isExistMyWard
      ) {
        // isWaiting이 false로 변경된 경우 -> 병동 요청이 처리됨 (승인 또는 거절)
        if (!isWaiting && userInfo.sentWardCode) {
          // existMyWard 값을 확인하여 승인/거절 처리 (API에서 가져온 최신 상태 사용)
          if (isExistMyWard) {
            // 승인된 경우: 사용자에게 알림 + 해당 페이지로 리다이렉트
            toast.success('병동 입장이 승인되었습니다!');

            // 사용자 상태 업데이트 (최신 상태로)
            userAuthStore.setUserInfo({
              ...userInfo,
              sentWardCode: false,
              existMyWard: true,
            });

            // 역할에 따라 적절한 페이지로 바로 리다이렉트
            if (userInfo.role === 'HN') {
              navigate('/shift-admin');
            } else {
              navigate('/my-shift');
            }
            return; // 리다이렉트 후 함수 종료
          } else {
            // 거절된 경우: 사용자에게 알림 + 병동 코드 입력 화면 표시
            toast.error('병동 입장 요청이 거절되었습니다. 다시 시도해주세요.');

            userAuthStore.setUserInfo({
              ...userInfo,
              sentWardCode: false,
              existMyWard: false,
            });
          }
        } else {
          // 그 외의 경우는 일반적으로 상태 업데이트 (양쪽 모두 최신 상태로)
          userAuthStore.setUserInfo({
            ...userInfo,
            sentWardCode: isWaiting,
            existMyWard: isExistMyWard,
          });
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('입장 대기 상태 확인 실패:', error);
      setIsLoading(false);
    }
  };

  const handleEnterWard = async (wardCode: string) => {
    try {
      // 1. 병동 코드 확인
      await wardService.checkWardCode(wardCode);

      // 2. 병동 입장 대기 성공 시 사용자 정보 업데이트
      userAuthStore.setUserInfo({
        ...userAuthStore.userInfo!,
        existMyWard: false,
        sentWardCode: true,
      });

      // 3. 성공 메시지 표시
      toast.success('병동 입장 요청이 완료되었습니다.');
    } catch (error: any) {
      console.error('병동 입장 실패:', error);
      if (error instanceof Error) {
        if (error.message === '서버 연결 실패') {
          toast.error('잠시 후 다시 시도해주세요');
          return;
        }
        if (error.message === 'UNAUTHORIZED') {
          navigate('/login');
          return;
        }
      }
      if (error?.response?.status === 400) {
        toast.error(error.response.data.message);
        return;
      }
      // 그 외의 모든 에러는 에러 페이지로 이동
      navigate('/error');
    }
  };

  return (
    <>
      <SEO
        title="병동 입장 | Dutymate"
        description="병동 입장을 위한 병동 코드를 입력해주세요."
      />
      {isLoading ? (
        <LandingTemplate showIntroText={false}>
          <div className="flex flex-col items-center justify-center text-center">
            <LoadingSpinner />
          </div>
        </LandingTemplate>
      ) : (
        <LandingTemplate showIntroText={false}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center">
              <p className="text-[#FF8282] font-semibold text-[1.125rem] mb-[0.25rem]">
                {userInfo?.name}님 환영합니다!
              </p>
              {userInfo?.sentWardCode ? (
                <>
                  <p className="mt-[0.9rem] mb-[1rem]"></p>
                  <WaitingForApproval />
                </>
              ) : (
                <>
                  <p className="text-primary-dark font-semibold text-[1rem] mt-[0.9rem] mb-[1rem]">
                    입장을 위해 전달 받은 병동 코드를 입력해주세요.
                  </p>
                  <EnterWardForm onSubmit={handleEnterWard} />
                </>
              )}
            </div>
          </div>
        </LandingTemplate>
      )}
    </>
  );
};

export default EnterWard;
