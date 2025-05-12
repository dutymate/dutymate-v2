import { toast } from 'react-toastify';
import CustomButton from '@/components/atoms/CustomButton';
import EnterWardForm from './EnterWardForm';
import WaitingForApproval from './WaitingForApproval';

interface UserInfo {
  existMyWard: boolean;
  sentWardCode: boolean;
}

interface JoinWardGuideModalProps {
  isEnteringWard: boolean;
  setIsEnteringWard: (value: boolean) => void;
  userInfo: UserInfo | null;
  onSubmit: (wardCode: string) => Promise<void>;
  removeRadius?: boolean;
  removeShadow?: boolean;
}

const JoinWardGuideModal = ({
  isEnteringWard,
  setIsEnteringWard,
  userInfo,
  onSubmit,
  removeRadius = false,
  removeShadow = false,
}: JoinWardGuideModalProps) => {
  if (isEnteringWard) {
    return (
      <div
        className={`bg-white ${removeRadius ? '' : 'rounded-[0.92375rem]'} ${removeShadow ? '' : 'shadow-[0_0_15px_rgba(0,0,0,0.1)]'} p-4 sm:p-6`}
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center">
            {userInfo?.sentWardCode ? (
              <WaitingForApproval />
            ) : (
              <div className="w-full max-w-[20rem] mx-auto flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-primary mt-1">
                    병동 입장하기
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mt-3 -mb-3 leading-[1.7] sm:leading-relaxed tracking-tight break-keep text-center">
                    <span className="text-primary-dark font-semibold">
                      병동 코드
                    </span>
                    는 관리자에게 전달받은 6자리 숫자입니다. 입력하시면 병동
                    입장을 요청할 수 있어요. <br className="hidden sm:block" />
                    코드가 없다면 관리자에게 문의해주세요.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm w-full">
                  <div className="p-2">
                    <EnterWardForm
                      onSubmit={onSubmit}
                      onCancel={() => setIsEnteringWard(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white ${removeRadius ? '' : 'rounded-[0.92375rem]'} ${removeShadow ? '' : 'shadow-[0_0_15px_rgba(0,0,0,0.1)]'} p-4 sm:p-6`}
    >
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          {/* 아이콘 섹션 */}
          <div>
            <div className="relative">
              <div className="w-16 h-16 bg-primary-10 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-dark"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 bg-primary-dark rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="w-full text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-black mb-2">
              함께하는 근무가 더 즐겁습니다!
            </h2>
            <p className="text-gray-600 mb-3 text-sm sm:text-base leading-relaxed">
              병동에 입장하여 동료들과 함께
              <br />
              <span className="text-primary-dark font-semibold">
                듀티메이트
              </span>
              의 모든 기능을 활용해보세요.
              <br />
              근무 교대와 일정 관리가 훨씬 쉬워집니다.
            </p>

            <div className="bg-primary-10 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm sm:text-base font-semibold text-black mb-3 text-center">
                병동 입장 시 이용 가능한 기능
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Icon /> 팀원 전체 근무표 한눈에 확인
                </li>
                <li className="flex items-center">
                  <Icon /> 근무 교대 요청 및 관리 간편화
                </li>
                <li className="flex items-center">
                  <Icon /> 근무표 자동 다운로드 및 공유
                </li>
              </ul>
            </div>

            <div className="flex gap-2 w-full">
              <CustomButton
                className="flex-1 flex items-center justify-center text-sm sm:text-base rounded-lg hover:from-primary-dark hover:to-primary-dark transition-all bg-gradient-to-r from-primary-dark to-primary-dark text-white font-semibold"
                style={{ minHeight: '2.75rem' }}
                onClick={() => setIsEnteringWard(true)}
              >
                병동 입장하기
              </CustomButton>
              <CustomButton
                className="flex-1 flex items-center justify-center text-sm sm:text-base rounded-lg transition-all bg-primary-10 text-primary-dark font-semibold hover:bg-primary-20"
                style={{ minHeight: '2.75rem' }}
                onClick={() => toast.info('친구 초대 기능 준비 중입니다.')}
              >
                친구 초대하기
              </CustomButton>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              이미 병동 코드가 있으신가요?{' '}
              <span
                onClick={() => setIsEnteringWard(true)}
                className="text-primary-dark hover:underline cursor-pointer"
              >
                입장하기
              </span>
              를 클릭하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWardGuideModal;

const Icon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-primary-dark mr-2 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
