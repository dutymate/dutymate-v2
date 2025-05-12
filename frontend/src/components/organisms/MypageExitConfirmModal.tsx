import { Button, ButtonColor } from '@/components/atoms/Button';
import useUserAuthStore from '@/stores/userAuthStore';

interface MypageExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exitRequestType: 'CREATE-WARD' | 'WARD' | 'WITHDRAWAL' | null;
  hasPendingNurses: boolean;
}

const MypageExitConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  exitRequestType,
  hasPendingNurses,
}: MypageExitConfirmModalProps) => {
  const { userInfo } = useUserAuthStore();

  if (!isOpen) {
    return null;
  }

  const getModalContent = (exitType: typeof exitRequestType) => {
    switch (exitType) {
      case 'CREATE-WARD':
        return {
          title: '병동을 생성해요',
          message: (
            <>
              병동을 생성하면{' '}
              <span className="text-duty-night font-bold">
                기존 작성한 근무표 데이터가 삭제
              </span>
              됩니다.
              <br />
              계속 진행하시겠습니까?
            </>
          ),
          cancelText: '취소',
          confirmText: '병동 생성하기',
          confirmColor: 'night',
          confirmStyle: 'bg-night',
        };
      case 'WARD':
        if (hasPendingNurses && userInfo?.role === 'HN') {
          return {
            title: '승인 대기중인 간호사가 있어요',
            message: (
              <>
                승인을 기다리는 간호사가 있습니다. 병동을 나가면
                <br />
                <span className="text-duty-night font-bold">
                  대기중인 모든 신청이 거절
                </span>
                됩니다.
                <br />
                계속 진행하시겠습니까?
              </>
            ),
            cancelText: '취소',
            confirmText: '병동 나가기',
            confirmColor: 'duty-night',
            confirmStyle: 'bg-duty-night',
          };
        }
        return {
          title: '병동을 나가요',
          message: (
            <>
              병동을 나가면{' '}
              <span className="text-duty-night font-bold">
                근무표의 모든 데이터가 삭제
              </span>
              됩니다.
              <br />
              계속 진행하시겠습니까?
            </>
          ),
          cancelText: '취소',
          confirmText: '병동 나가기',
          confirmColor: 'night',
          confirmStyle: 'bg-night',
        };
      case 'WITHDRAWAL':
        return {
          title: '회원 탈퇴를 진행할까요?',
          message: (
            <>
              탈퇴하면{' '}
              <span className="text-red-500 font-medium">
                계정 정보가 즉시 비활성화
              </span>
              되며,
              <br />
              모든 데이터는 복구할 수 없습니다.
              <br />
              정말 탈퇴하시겠습니까?
            </>
          ),
          cancelText: '취소',
          confirmText: '탈퇴하기',
          confirmStyle: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
        };
      default:
        return {
          title: '',
          message: '',
          cancelText: '',
          confirmText: '',
          confirmStyle: '',
        };
    }
  };

  const {
    title,
    message,
    cancelText,
    confirmText,
    confirmColor,
    confirmStyle,
  } = getModalContent(exitRequestType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-[90%] max-w-[22.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 제목 */}
          <div className="mb-4">
            <h2 className="text-[0.9375rem] font-medium">{title}</h2>
          </div>

          {/* 메시지 표시 */}
          <p className="text-[0.9375rem] leading-relaxed mb-6">{message}</p>

          {/* 버튼 영역 */}
          <div className="flex gap-2">
            <Button
              size="md"
              color={confirmColor as ButtonColor}
              onClick={onConfirm}
              className={`flex-1 text-white font-normal rounded-xl py-3 transition-colors ${confirmStyle}`}
            >
              {confirmText}
            </Button>
            <Button
              size="md"
              color="muted"
              onClick={onClose}
              className="flex-1 bg-[#F1F1F1] hover:bg-[#E5E5E5] active:bg-[#DADADA] text-black font-normal rounded-xl py-3 transition-colors"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MypageExitConfirmModal;
