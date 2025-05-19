import { Button } from '@/components/atoms/Button.tsx';

interface RemoveNurseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  removeTarget: 'SELF' | 'HN' | 'RN' | null;
  removeTargetName: string | null;
}

const RemoveNurseConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  removeTarget,
  removeTargetName,
}: RemoveNurseConfirmModalProps) => {
  if (!isOpen) {
    return null;
  }

  const getModalContent = (target: typeof removeTarget) => {
    switch (target) {
      case 'SELF':
        return {
          title: '병동을 나가요',
          message: '마이페이지에서 병동을 나갈 수 있습니다.',
          cancelText: '취소',
          confirmText: '이동하기',
        };
      case 'HN':
        return {
          title: '관리자를 내보내요',
          message: `정말 ${removeTargetName} 님을 병동에서 내보내시겠습니까?`,
          cancelText: '취소',
          confirmText: '내보내기',
        };
      case 'RN':
        return {
          title: '간호사를 내보내요',
          message: `정말 ${removeTargetName} 님을 병동에서 내보내시겠습니까?`,
          cancelText: '취소',
          confirmText: '내보내기',
        };
      default:
        return {
          title: '간호사를 내보내요',
          message: '정말 선택한 간호사를 내보내시겠습니까?',
          cancelText: '취소',
          confirmText: '내보내기',
        };
    }
  };

  const { title, message, cancelText, confirmText } =
    getModalContent(removeTarget);

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
          <h2 className="text-[0.9375rem] font-medium text-left mb-2">
            {title}
          </h2>

          {/* 메시지 표시 */}
          <p className="text-left mb-6 text-[0.9375rem]">{message}</p>

          {/* 버튼 영역 */}
          <div className="flex gap-2">
            <Button
              size="md"
              color="muted"
              onClick={onClose}
              className="flex-1 bg-[#F1F1F1] hover:bg-[#E5E5E5] active:bg-[#DADADA] text-black font-normal rounded-xl py-3 transition-colors"
            >
              {cancelText}
            </Button>
            <Button
              size="md"
              color="primary"
              onClick={onConfirm}
              className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveNurseConfirmModal;
