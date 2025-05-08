import { useNavigate } from 'react-router-dom';

import {
  CancelEnterWardButton,
  EnterWardLogoutButton,
} from '@/components/atoms/Button';
import useUserAuthStore from '@/stores/userAuthStore';
import userService from '@/services/userService';
import { toast } from 'react-toastify';

const WaitingForApproval = () => {
  const navigate = useNavigate();
  const userAuthStore = useUserAuthStore();
  const userInfo = useUserAuthStore.getState().userInfo;

  const handleLogoutButton = () => {
    useUserAuthStore.getState().logout();
    navigate('/login');
  };

  const handleCancelEnterWardButton = async () => {
    try {
      // 입장 대기 취소 API 호출
      await userService.cancelEnterWardWaiting();

      // 사용자 상태 업데이트 (sentWardCode를 false로 설정)
      if (userInfo) {
        userAuthStore.setUserInfo({
          ...userInfo,
          sentWardCode: false,
        });
      }

      // 사용자에게 알림
      toast.success('병동 입장 요청이 취소되었습니다.');

      // 페이지 새로고침 (또는 리다이렉트)
      navigate('/enter-ward');
    } catch (error: any) {
      console.error('입장 취소 실패:', error);

      // 오류 메시지 확인 및 라우팅 처리
      if (
        error.message &&
        error.message.includes('이미 병동에 입장한 상태입니다')
      ) {
        toast.info('이미 병동에 입장되어 있습니다. 병동 화면으로 이동합니다.');
        // 병동 화면으로 이동
        navigate('/my-shift');
      } else if (
        error.message &&
        error.message.includes('병동 입장이 거절된 상태입니다')
      ) {
        toast.warning(
          '병동 입장이 거절되었습니다. 다시 입장 코드를 입력해주세요.'
        );

        // userInfo가 있는 경우에만 상태 업데이트
        if (userInfo) {
          userAuthStore.setUserInfo({
            ...userInfo,
            sentWardCode: false,
          });
        }

        // 입장 코드 입력 화면으로 이동
        navigate('/enter-ward');
      } else {
        // 기타 오류는 그대로 표시
        toast.error(error.message || '입장 취소 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center w-full">
        <h1 className="text-[1.25rem] font-bold text-gray-800 mb-[0.25rem]">
          병동 입장 대기 중입니다.
        </h1>
        <p className="text-gray-400 text-[0.9rem] mb-[2rem]">
          관리자의 승인 후 입장이 가능합니다. <br />
          병동 관리자에게 문의해주세요!
        </p>
        <div className="w-full mt-0 lg:mt-0  flex flex-col gap-[0.5rem]">
          <EnterWardLogoutButton onClick={handleLogoutButton} />
          <CancelEnterWardButton onClick={handleCancelEnterWardButton} />
        </div>
      </div>
    </div>
  );
};

export default WaitingForApproval;
