import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import { UnreflectedRequest } from '@/services/dutyService';
import { requestService } from '@/services/requestService';
import { toast } from 'react-toastify';
import { dutyService } from '@/services/dutyService';
import useUserAuthStore from '@/stores/userAuthStore';
import PaymentModal from '@/components/organisms/PaymentModal';
import DemoSignupModal from '@/components/organisms/DemoSignupModal';
import { useNavigate } from 'react-router-dom';

interface UnreflectedRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreflectedRequests: UnreflectedRequest[];
  onRegenerateWithPriority: (selectedRequestIds: number[]) => Promise<void>;
}

const UnreflectedRequestsModal: React.FC<UnreflectedRequestsModalProps> = ({
  isOpen,
  onClose,
  unreflectedRequests,
  onRegenerateWithPriority,
}) => {
  const [selectedRequests, setSelectedRequests] = useState<
    Record<number, boolean>
  >({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [viewingMemo, setViewingMemo] = useState<{
    id: number;
    memo: string;
  } | null>(null);
  const memoModalRef = useRef<HTMLDivElement>(null);
  const [autoGenCnt, setAutoGenCnt] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDemoSignupModalOpen, setIsDemoSignupModalOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedRequests((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = unreflectedRequests.every(
      (_, index) => selectedRequests[index]
    );

    if (allSelected) {
      // 모두 선택되어 있으면 모두 해제
      setSelectedRequests({});
    } else {
      // 아니면 모두 선택
      const newSelected: Record<number, boolean> = {};
      unreflectedRequests.forEach((_, index) => {
        newSelected[index] = true;
      });
      setSelectedRequests(newSelected);
    }
  };

  // 자동 생성 횟수 가져오기
  useEffect(() => {
    const fetchAutoGenCount = async () => {
      try {
        const data = await dutyService.getAutoGenCount();
        setAutoGenCnt(data);
      } catch (error) {
        console.error('Failed to fetch auto generation count:', error);
      }
    };

    if (isOpen) {
      fetchAutoGenCount();
    }
  }, [isOpen]);

  const handleRegenerate = async () => {
    if (Object.keys(selectedRequests).length === 0) {
      return;
    }

    try {
      // DEMO: autogenCnt 0 & demo 계정이면 회원가입 유도 모달
      if (autoGenCnt <= 0 && isDemo) {
        setIsDemoSignupModalOpen(true);
        return;
      }

      // 자동 생성 횟수가 0 이하인 경우 결제 모달로 이동
      if (autoGenCnt <= 0) {
        setIsPaymentModalOpen(true);
        return;
      }

      setIsRegenerating(true);
      const selectedRequestIds = Object.entries(selectedRequests)
        .filter(([_, isSelected]) => isSelected)
        .map(([index]) => unreflectedRequests[parseInt(index)].requestId);

      await onRegenerateWithPriority(selectedRequestIds);

      setSelectedRequests({});
      setViewingMemo(null);

      // 자동 생성 횟수 감소
      setAutoGenCnt((prev) => prev - 1);
    } catch (error) {
      console.error('Error regenerating with priority:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'quarterly' | 'yearly') => {
    try {
      const response = await dutyService.subscribe();
      setIsPaymentModalOpen(false);

      if (response && response.addNum !== undefined) {
        setAutoGenCnt(response.addNum);
      } else {
        const defaultCounts = {
          monthly: 100,
          quarterly: 100,
          yearly: 100,
        };
        setAutoGenCnt(defaultCounts[plan]);
      }
    } catch (error) {
      setIsPaymentModalOpen(false);
    }
  };

  const showMemoModal = (id: number, memo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!memo) return;
    setViewingMemo({ id, memo });
  };

  const closeMemoModal = () => {
    setViewingMemo(null);
  };

  const handleComplete = async () => {
    try {
      setIsRejecting(true);
      const loadingToast = toast.loading(
        '반영되지 않은 요청을 거절 처리 중...'
      );

      // 모든 반영되지 않은 요청을 거절 상태로 변경
      const rejectPromises = unreflectedRequests.map((request) =>
        requestService.editRequestStatus(request.requestId, {
          memberId: request.memberId,
          status: 'DENIED',
        })
      );

      await Promise.all(rejectPromises);

      // 로딩 토스트를 닫고 새로운 성공 토스트를 표시
      toast.dismiss(loadingToast);
      toast.success('반영되지 않은 요청이 거절 처리되었습니다.');

      onClose();
    } catch (error) {
      console.error('Error rejecting requests:', error);
      toast.error('요청 거절 처리에 실패했습니다.');
    } finally {
      setIsRejecting(false);
    }
  };

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        memoModalRef.current &&
        !memoModalRef.current.contains(event.target as Node)
      ) {
        closeMemoModal();
      }
    };

    if (viewingMemo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [viewingMemo]);

  if (!isOpen) {
    return null;
  }

  const selectedCount = Object.values(selectedRequests).filter(Boolean).length;
  const isAllSelected =
    selectedCount === unreflectedRequests.length &&
    unreflectedRequests.length > 0;

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
        className="bg-white rounded-xl shadow-lg w-full max-w-xs sm:max-w-sm max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-2 sm:px-3 py-1 border-b">
          <h2 className="text-sm sm:text-m font-medium text-primary-dark">
            반려된 근무 요청
          </h2>
          <button
            onClick={onClose}
            className="text-primary hover:text-primary/80"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        <div className="p-2 sm:p-3">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 rounded-md">
              <Icon
                name="alert"
                size={18}
                className="text-yellow-500 flex-shrink-0"
              />
              <p className="text-sm">
                <span className="font-medium block">
                  일부 근무 요청이 반영되지 않았습니다.
                </span>
                <span className="text-xs text-gray-600 mt-1 block">
                  다른 제약 조건으로 인해 반영되지 않은 요청들입니다.
                </span>
              </p>
            </div>

            <div className="text-xs text-gray-600 p-2 mb-2 bg-gray-50 rounded-md flex items-center">
              <span className="font-bold text-primary mr-1">Tip:</span> 선택한
              요청을 우선하여 재생성을 시도해보세요.
            </div>
          </div>

          {unreflectedRequests.length > 0 ? (
            <div className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="pl-2 pr-1 py-1 sm:py-2 w-6">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="px-1 sm:px-2 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex justify-center ">
                      정보
                    </th>
                    <th className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청 사유
                    </th>
                    <th className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-14 sm:w-16">
                      요청 근무
                    </th>
                    <th className="px-0 py-1 sm:py-2 w-4 sm:w-6"></th>
                    <th className="px-1 sm:px-2 py-1 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-14 sm:w-16">
                      배정 근무
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unreflectedRequests.map((request, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="pl-2 pr-1 py-1 sm:py-2">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 text-primary rounded border-gray-300 focus:ring-primary"
                            checked={!!selectedRequests[index]}
                            onChange={() => handleCheckboxChange(index)}
                          />
                        </div>
                      </td>
                      <td className="px-1 sm:px-2 py-1 sm:py-2 flex justify-center ">
                        <div className="flex-col">
                          <span className="text-xs font-medium text-gray-900">
                            {request.memberName}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(request.requestDate)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">
                        {request.requestMemo ? (
                          <button
                            className="text-xs text-gray-500 hover:text-primary flex items-center mx-auto"
                            onClick={(e) =>
                              showMemoModal(index, request.requestMemo, e)
                            }
                          >
                            <Icon name="message" size={12} className="mr-0.5" />
                            <span className="underline">요청 사유</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-1 sm:px-2 py-1 sm:py-2">
                        <div className="flex justify-center">
                          <DutyBadgeEng
                            type={
                              request.requestShift as
                                | 'D'
                                | 'E'
                                | 'N'
                                | 'O'
                                | 'X'
                                | 'M'
                            }
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-0 py-1 sm:py-2 text-center">
                        <span className="text-gray-400 text-xs">→</span>
                      </td>
                      <td className="px-1 sm:px-2 py-1 sm:py-2">
                        <div className="flex justify-center">
                          <DutyBadgeEng
                            type={
                              request.actualShift as
                                | 'D'
                                | 'E'
                                | 'N'
                                | 'O'
                                | 'X'
                                | 'M'
                            }
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              반영되지 않은 요청이 없습니다.
            </div>
          )}
          {selectedCount > 0 && (
            <div className="text-xs text-gray-600 p-1 mt-1 rounded-md flex overflow-hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-red-500 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex items-center ">
                <span className="font-bold text-red-600 mr-3">경고: </span> 다른
                요청 반려 가능, 재생성 횟수 1회 감소
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-1">
            {selectedCount > 0 && (
              <div className="flex-1 text-xs text-gray-600 flex items-center">
                <span className="font-medium">{selectedCount}개</span> 요청
                선택됨
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600 flex items-center">
                <span className="font-medium text-primary">{autoGenCnt}</span>회
                남음
              </div>
              <Button
                size="xs"
                color="primary"
                onClick={handleRegenerate}
                disabled={isRegenerating || selectedCount === 0}
                className={
                  selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }
              >
                {isRegenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-1.5 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                    재생성 중...
                  </div>
                ) : (
                  '선택 요청 재반영'
                )}
              </Button>
              <Button
                size="xs"
                color="off"
                onClick={handleComplete}
                disabled={isRejecting}
              >
                완료
              </Button>
            </div>
          </div>
        </div>

        {/* 메모 모달 (테이블 외부에 배치) */}
        {viewingMemo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black bg-opacity-30"
              onClick={closeMemoModal}
            ></div>
            <div
              ref={memoModalRef}
              className="bg-white rounded-lg shadow-lg p-3 max-w-[75%] sm:max-w-xs w-full z-[70] relative mx-3"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">요청 메모</h3>
                <button
                  onClick={closeMemoModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-700 break-words">
                {viewingMemo.memo}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add PaymentModal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubscribe={handleSubscribe}
      />

      {/* Add DemoSignupModal */}
      <DemoSignupModal
        isOpen={isDemoSignupModalOpen}
        onClose={() => setIsDemoSignupModalOpen(false)}
        onSignup={() => {
          setIsDemoSignupModalOpen(false);
          navigate('/login');
        }}
        onContinue={() => setIsDemoSignupModalOpen(false)}
      />
    </div>
  );
};

export default UnreflectedRequestsModal;
