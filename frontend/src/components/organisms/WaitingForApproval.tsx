import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CancelEnterWardButton } from '@/components/atoms/Button';
import useUserAuthStore from '@/stores/userAuthStore';
import userService from '@/services/userService';

const WaitingForApproval = () => {
  const navigate = useNavigate();
  const userAuthStore = useUserAuthStore();
  const userInfo = useUserAuthStore.getState().userInfo;

  const handleCancelEnterWardButton = async () => {
    try {
      await userService.cancelEnterWardWaiting();
      if (userInfo) {
        userAuthStore.setUserInfo({
          ...userInfo,
          sentWardCode: false,
        });
      }
      toast.success('병동 입장 요청이 취소되었습니다.');
    } catch (error: any) {
      console.error('입장 취소 실패:', error);
      if (error.message?.includes('이미 병동에 입장한 상태입니다')) {
        toast.info('이미 병동에 입장되어 있습니다. 병동 화면으로 이동합니다.');
        if (userInfo) {
          userAuthStore.setUserInfo({
            ...userInfo,
            existMyWard: true,
            sentWardCode: false,
          });
        }
        navigate('/my-shift');
      } else if (error.message?.includes('병동 입장이 거절된 상태입니다')) {
        toast.warning(
          '병동 입장이 거절되었습니다. 다시 입장 코드를 입력해주세요.'
        );
        if (userInfo) {
          userAuthStore.setUserInfo({
            ...userInfo,
            existMyWard: false,
            sentWardCode: false,
          });
        }
      } else {
        toast.error(error.message || '입장 취소 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          {/* 아이콘 섹션 */}
          <div>
            <div className="relative">
              <div className="bg-purple-50 rounded-xl p-6 mb-4 text-center w-full sm:w-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 컨텐츠 섹션 */}
          <div className="w-full text-center">
            <h2 className="text-xl sm:text-3xl font-bold text-purple-800 mb-3">
              병동 입장 대기 중입니다
            </h2>
            <p className="text-gray-600 mb-6 text-base sm:text-lg leading-relaxed">
              관리자의 승인 후 입장이 가능합니다.
              <br />
              병동 관리자에게 문의해주세요!
            </p>

            {/* 버튼 영역 */}
            <div className="w-full max-w-sm mx-auto">
              <CancelEnterWardButton
                onClick={handleCancelEnterWardButton}
                className="w-full flex items-center justify-center py-5 sm:py-3.5 text-base sm:text-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-lg"
              />
            </div>

            {/* 추가 안내 */}
            <p className="text-sm text-gray-400 mt-4">
              승인이 늦어질 경우 병동 관리자에게 직접 문의해보세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingForApproval;
