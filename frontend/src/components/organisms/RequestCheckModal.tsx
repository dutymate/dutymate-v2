import { useEffect, useState, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';

import { Button } from '@/components/atoms/Button';
import ReqAdminTable from '@/components/organisms/ReqAdminTable';
import { requestService, WardRequest } from '@/services/requestService';
import { useRequestCountStore } from '@/stores/requestCountStore';

interface RequestCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoGenerate: () => void;
}

const RequestCheckModal = ({
  isOpen,
  onClose,
  onAutoGenerate,
}: RequestCheckModalProps) => {
  const [requests, setRequests] = useState<WardRequest[]>([]);
  const [allRequests, setAllRequests] = useState<WardRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestCount = useRequestCountStore((state) => state.count);
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const data = await requestService.getWardRequests();
        setAllRequests(data);
        // 대기 중인 요청만 필터링
        const pendingRequests = data.filter(
          (request: WardRequest) => request.status === 'HOLD'
        );
        setRequests(pendingRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-lg w-[90vw] max-w-[800px] max-h-[90vh] overflow-hidden relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-[1rem] py-[0.75rem] border-b">
          <h2 className="text-base font-medium text-primary-dark">
            요청 확인 및 자동 생성
          </h2>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary/80"
          >
            <IoMdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-[1rem] overflow-y-auto max-h-[calc(90vh-4rem)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-[20rem]">
              <div className="animate-spin rounded-full h-[2rem] w-[2rem] border-[0.125rem] border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-[0.25rem] py-[0.5rem] px-[0.25rem] rounded text-md text-base-dark mb-[0rem]">
                {requestCount > 0 ? (
                  <span>
                    대기 중인 요청이 있습니다. 요청을 처리한 후 자동 생성을
                    진행해주세요.
                  </span>
                ) : allRequests.length > 0 ? (
                  <span>
                    모든 요청이 처리되었습니다. 자동 생성을 시작할 수 있습니다.
                  </span>
                ) : (
                  <span>
                    요청 내역이 없습니다. 자동 생성을 시작할 수 있습니다.
                  </span>
                )}
              </div>

              {/* 항상 테이블 표시, 하지만 HOLD 상태인 요청만 필터링하여 보여줌 */}
              <ReqAdminTable requests={requests} />

              {/* 항상 버튼 표시 (requestCount에 따라 활성화/비활성화) */}
              <div className="flex justify-end mt-[0rem] mb-[1rem]">
                <Button
                  onClick={() => {
                    onAutoGenerate();
                    onClose();
                  }}
                  size="md"
                  color="primary"
                  disabled={requestCount > 0}
                  className="w-[12rem]"
                >
                  자동 생성 시작
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCheckModal;
