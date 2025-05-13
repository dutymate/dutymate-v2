import {
  forwardRef,
  useEffect,
  useState,
  useImperativeHandle,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import { ApprovalBtn } from '@/components/atoms/ApprovalBtn';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { requestService, WardRequest } from '@/services/requestService.ts';
import { useLoadingStore } from '@/stores/loadingStore';
import { useRequestCountStore } from '@/stores/requestCountStore';
import { Icon } from '@/components/atoms/Icon';

interface ReqAdminTableProps {
  requests?: WardRequest[];
}

export interface ReqAdminTableRef {
  fetchRequests: () => Promise<void>;
}

const ReqAdminTable = forwardRef<ReqAdminTableRef, ReqAdminTableProps>(
  ({ requests: propRequests }, ref) => {
    const [requests, setRequests] = useState<WardRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm] = useState('');
    const [viewingMemo, setViewingMemo] = useState<{
      id: number;
      memo: string;
    } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const memoModalRef = useRef<HTMLDivElement>(null);
    const setRequestCount = useRequestCountStore((state) => state.setCount);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Add date state
    const [selectedDate, setSelectedDate] = useState(() => {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };
    });

    // Add date navigation functions
    const handlePrevMonth = () => {
      setSelectedDate((prev) => {
        const newMonth = prev.month - 1;
        if (newMonth < 1) {
          return { year: prev.year - 1, month: 12 };
        }
        return { ...prev, month: newMonth };
      });
    };

    const handleNextMonth = () => {
      setSelectedDate((prev) => {
        const newMonth = prev.month + 1;
        if (newMonth > 12) {
          return { year: prev.year + 1, month: 1 };
        }
        return { ...prev, month: newMonth };
      });
    };

    // 요청 목록 조회
    const fetchRequests = async () => {
      useLoadingStore.getState().setLoading(true);
      try {
        const data = await requestService.getWardRequestsByDate(
          selectedDate.year,
          selectedDate.month
        );
        setRequests(data);
        // HOLD 상태의 요청만 카운트
        const pendingCount = data.filter(
          (request: WardRequest) => request.status === 'HOLD'
        ).length;
        setRequestCount(pendingCount);
      } catch (error) {
        toast.error('요청 목록을 불러오는데 실패했습니다');
      } finally {
        useLoadingStore.getState().setLoading(false);
        setIsLoading(false);
      }
    };

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ref를 통해 fetchRequests 함수 노출
    useImperativeHandle(ref, () => ({
      fetchRequests,
    }));

    // 상태 변경 처리
    const handleStatusChange = async (
      requestId: number,
      memberId: number,
      status: 'ACCEPTED' | 'DENIED' | 'HOLD'
    ) => {
      // 이전 상태 저장
      const prevRequest = requests.find(
        (request) => request.requestId === requestId
      );
      if (!prevRequest) return;

      // 즉시 UI 업데이트
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.requestId === requestId ? { ...request, status } : request
        )
      );

      // HOLD 상태의 요청 개수 즉시 업데이트
      const updatedRequests = requests.map((request) =>
        request.requestId === requestId ? { ...request, status } : request
      );
      const pendingCount = updatedRequests.filter(
        (request) => request.status === 'HOLD'
      ).length;
      setRequestCount(pendingCount);

      try {
        // 백그라운드에서 API 호출
        await requestService.editRequestStatus(requestId, {
          memberId,
          status,
        });
        toast.success('요청 상태가 변경되었습니다');
      } catch (error) {
        // API 호출 실패 시 이전 상태로 복구
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.requestId === requestId
              ? { ...request, status: prevRequest.status }
              : request
          )
        );
        // 이전 상태로 카운트 복구
        const previousPendingCount = requests.filter(
          (request) => request.status === 'HOLD'
        ).length;
        setRequestCount(previousPendingCount);
        toast.error('요청 상태 변경에 실패했습니다');
      }
    };

    useEffect(() => {
      if (propRequests) {
        setRequests(propRequests);
        setIsLoading(false);
      } else {
        fetchRequests();
      }
    }, [propRequests, selectedDate.year, selectedDate.month]);

    // 검색 필터링
    const filteredRequests = requests
      .filter((request) =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // HOLD 상태를 우선 정렬
        if (a.status === 'HOLD' && b.status !== 'HOLD') return -1;
        if (a.status !== 'HOLD' && b.status === 'HOLD') return 1;

        // HOLD 상태가 아닌 경우 createdAt으로 정렬 (최신순)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredRequests.slice(startIndex, endIndex);

    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const showMemoModal = (id: number, memo: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!memo) return;
      setViewingMemo({ id, memo });
    };

    const closeMemoModal = () => {
      setViewingMemo(null);
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

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <div className="w-full">
        <div className="bg-white rounded-[1.154375rem] p-1 sm:p-6">
          <h2 className="text-base lg:text-[1.125rem] font-semibold whitespace-nowrap">
            요청 내역
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-between mb-[1rem] px-[0.5rem]">
            <div className="flex items-center justify-between w-full">
              {/* 월 이동 컨트롤 */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="text-sm sm:text-base lg:text-lg font-medium whitespace-nowrap">
                    {selectedDate.year}년 {selectedDate.month}월
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 요청 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] md:min-w-[40rem] lg:min-w-0 lg:w-full table-fixed">
              {/* 헤더 */}
              <thead>
                <tr>
                  {/* 모바일: 이름+날짜 통합 헤더 */}
                  <th className="bg-base-muted-30 rounded-l-xl md:hidden w-[4rem] lg:w-[11.25rem] p-[0.25rem] text-left">
                    <div className="flex justify-center">
                      <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium">
                        이름
                      </span>
                    </div>
                  </th>
                  {/* 데스크톱: 이름 헤더 */}
                  <th className="bg-base-muted-30 rounded-l-xl hidden md:table-cell w-[5rem] lg:w-[7.5rem] p-[0.5rem] text-left">
                    <div className="flex justify-center">
                      <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium">
                        이름
                      </span>
                    </div>
                  </th>
                  {/* 데스크톱: 날짜 헤더 */}
                  <th className="bg-base-muted-30 hidden md:table-cell w-[4rem] lg:w-[5.625rem] p-[0.5rem]">
                    <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
                      날짜
                    </span>
                  </th>
                  <th className="bg-base-muted-30 w-[3.5rem] lg:w-[4.125rem] p-[0.5rem]">
                    <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
                      근무
                    </span>
                  </th>
                  <th className="bg-base-muted-30 hidden md:table-cell w-[12rem] lg:w-[11.25rem] p-[0.5rem]">
                    <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
                      내용
                    </span>
                  </th>
                  <th className="bg-base-muted-30 md:hidden w-[4rem] lg:w-[16rem] p-[0.25rem]">
                    <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
                      내용
                    </span>
                  </th>
                  <th className="bg-base-muted-30 rounded-r-xl w-[8rem] lg:w-[11.25rem] p-[0.25rem]">
                    <div className="flex justify-center">
                      <span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium">
                        상태
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* 요청 목록 본문 */}
              <tbody>
                {currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isMobile ? 4 : 5}>
                      <div className="flex items-center justify-center h-[25rem] text-gray-500">
                        요청 내역이 없습니다.
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((request) => (
                    <tr
                      key={request.requestId}
                      className="border-b border-gray-100"
                    >
                      {/* 모바일: 이름과 날짜 합쳐서 표시 */}
                      <td className="md:hidden w-[4rem] lg:w-[11.25rem] p-[0.25rem]">
                        <div className="flex flex-col items-center">
                          <span className="font-medium truncate text-[0.75rem] lg:text-[1rem] whitespace-nowrap">
                            {request.name}
                          </span>
                          <span className="text-gray-500 text-[0.75rem] lg:text-[0.875rem]">
                            {request.date.split('-').slice(1).join('-')}
                          </span>
                        </div>
                      </td>
                      {/* 데스크톱: 이름과 날짜 분리해서 표시 */}
                      <td className="hidden md:table-cell w-[5rem] lg:w-[7.5rem] p-[0.5rem]">
                        <div className="flex items-center justify-center">
                          <span className="font-medium truncate text-[0.75rem] lg:text-[1rem] whitespace-nowrap">
                            {request.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell w-[4rem] lg:w-[5.625rem] p-[0.5rem]">
                        <div className="text-gray-600 text-[0.75rem] lg:text-[0.875rem] text-center whitespace-nowrap">
                          {request.date}
                        </div>
                      </td>
                      <td className="w-[3.5rem] lg:w-[4.125rem] p-[0.25rem]">
                        <div className="flex justify-center scale-75 lg:scale-90">
                          <DutyBadgeKor
                            type={
                              request.shift === 'D'
                                ? 'day'
                                : request.shift === 'E'
                                  ? 'evening'
                                  : request.shift === 'N'
                                    ? 'night'
                                    : 'off'
                            }
                            size="xs"
                          />
                        </div>
                      </td>
                      <td className="hidden md:table-cell w-[12rem] lg:w-[11.25rem] p-[0.5rem]">
                        {request.memo ? (
                          <button
                            className="text-[0.875rem] lg:text-[1rem] text-gray-600 hover:text-primary flex items-center justify-center w-full"
                            onClick={(e) =>
                              showMemoModal(request.requestId, request.memo, e)
                            }
                          >
                            <span className="truncate text-left w-full">
                              {request.memo}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[0.875rem] lg:text-[1rem] text-gray-400 text-center block">
                            -
                          </span>
                        )}
                      </td>
                      <td className="md:hidden w-[8rem] lg:w-[16rem] p-[0.25rem]">
                        {request.memo ? (
                          <button
                            className="text-xs text-gray-500 hover:text-primary flex items-center justify-center w-full whitespace-nowrap"
                            onClick={(e) =>
                              showMemoModal(request.requestId, request.memo, e)
                            }
                          >
                            <Icon
                              name="message"
                              size={12}
                              className="mr-0.5 flex-shrink-0"
                            />
                            <span className="underline truncate">사유</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 text-center block">
                            -
                          </span>
                        )}
                      </td>
                      <td className="w-[8rem] lg:w-[11.25rem] p-[0.25rem]">
                        <div className="flex justify-center items-center h-full whitespace-nowrap">
                          <div className="scale-[0.65] lg:scale-90 transform-gpu">
                            <ApprovalBtn
                              onApprove={() =>
                                handleStatusChange(
                                  request.requestId,
                                  request.memberId,
                                  'ACCEPTED'
                                )
                              }
                              onReject={() =>
                                handleStatusChange(
                                  request.requestId,
                                  request.memberId,
                                  'DENIED'
                                )
                              }
                              onHold={() =>
                                handleStatusChange(
                                  request.requestId,
                                  request.memberId,
                                  'HOLD'
                                )
                              }
                              currentStatus={request.status}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-md text-sm ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 메모 모달 */}
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
                <h3 className="text-sm font-medium">사유</h3>
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
    );
  }
);

export default ReqAdminTable;
