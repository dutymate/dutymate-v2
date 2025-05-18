import React, { useState, useEffect, useRef } from 'react';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { getDutyColors } from '@/utils/dutyUtils';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { dutyService, MyDuty } from '@/services/dutyService';
import { toast } from 'react-toastify';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';

interface WorkCRUDModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  onDutyUpdated?: () => void;
  currentShift?: 'D' | 'E' | 'N' | 'O' | 'M' | 'X';
  dutyData?: MyDuty | null;
  setMyDutyData?: React.Dispatch<React.SetStateAction<MyDuty | null>>;
}

const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
type DutyType = (typeof dutyTypes)[number];

// 듀티 타입을 쉬프트 코드로 변환하는 함수
const typeToShiftCode = (type: DutyType): 'D' | 'E' | 'N' | 'O' | 'M' | 'X' => {
  switch (type) {
    case 'day':
      return 'D';
    case 'evening':
      return 'E';
    case 'night':
      return 'N';
    case 'off':
      return 'O';
    case 'mid':
      return 'M';
    default:
      return 'X';
  }
};

// Empty 뱃지 컴포넌트 추가
const EmptyBadge = () => {
  return (
    <span
      translate="no"
      className="
        inline-flex items-center justify-center
        rounded-[13px]
        font-semibold
        whitespace-nowrap
        bg-gray-200 text-gray-600
        text-base w-[88px] h-[48px]
      "
    >
      -
    </span>
  );
};

const WorkCRUDModal = ({
  open,
  onClose,
  selectedDate,
  setSelectedDate,
  onDutyUpdated,
  currentShift,
  dutyData,
  setMyDutyData,
}: WorkCRUDModalProps) => {
  const [selectedDutyType, setSelectedDutyType] = useState<DutyType>('day');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { userInfo } = useUserAuthStore();
  const dutyColors = getDutyColors(userInfo?.color);
  const [modalPosition, setModalPosition] = useState({
    left: '50%',
    top: '100px',
  });
  const [isVerticalMode, setIsVerticalMode] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  // 사용자가 모달을 수동으로 움직였는지 여부를 추적
  const [hasUserMovedModal, setHasUserMovedModal] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 사용자가 모달을 이미 이동했으면 위치를 유지
    if (hasUserMovedModal && !isMobile) return;

    // 모바일일 경우 중앙 하단에 표시
    if (isMobile) {
      setHasUserMovedModal(false);
      return;
    }

    // 데스크톱에서는 고정된 위치에 표시
    const calendarWidth =
      document
        .querySelector('.calendar-modal-container')
        ?.getBoundingClientRect().width || 0;
    const screenWidth = window.innerWidth;

    // 캘린더 컴포넌트가 있으면 오른쪽에 배치, 없으면 화면 중앙
    if (calendarWidth > 0) {
      // 캘린더 영역의 오른쪽에 패딩을 두고 모달 배치 - 더 왼쪽으로 조정
      const leftPosition = Math.min(calendarWidth - 120, screenWidth - 300);
      setModalPosition({
        left: `${leftPosition}px`,
        top: '180px', // 위치 조정
      });
    } else {
      // 캘린더를 찾지 못하면 화면 중앙에 배치 - 위치 조정
      setModalPosition({
        left: '35%', // 더 왼쪽으로 조정
        top: '180px', // 위치 조정
      });
    }
  }, [open, isMobile, hasUserMovedModal]);

  // 드래그 기능 구현
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = modalRef.current?.getBoundingClientRect().left || 0;
    const startTop = modalRef.current?.getBoundingClientRect().top || 0;

    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current || !isDraggingRef.current) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = startLeft + dx;
      const newTop = startTop + dy;

      setModalPosition({
        left: `${newLeft}px`,
        top: `${newTop}px`,
      });

      // 사용자가 모달을 움직였음을 표시
      setHasUserMovedModal(true);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 터치 이벤트 처리 (드래그 기능)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) return;

    const touch = e.touches[0];
    initialTouchRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      isMobile ||
      !initialTouchRef.current ||
      !modalRef.current ||
      !isDraggingRef.current
    )
      return;

    const touch = e.touches[0];
    const dx = touch.clientX - initialTouchRef.current.x;
    const dy = touch.clientY - initialTouchRef.current.y;

    const rect = modalRef.current.getBoundingClientRect();

    setModalPosition({
      left: `${rect.left + dx}px`,
      top: `${rect.top + dy}px`,
    });

    // 사용자가 모달을 움직였음을 표시
    setHasUserMovedModal(true);

    initialTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // 모달 닫힐 때 위치 초기화
  useEffect(() => {
    if (!open) {
      setHasUserMovedModal(false);
    }
  }, [open]);

  // 가로/세로 모드 전환
  const toggleLayout = () => {
    if (!isMobile) {
      setIsVerticalMode(!isVerticalMode);
    }
  };

  // 근무 입력(서버 반영) 함수
  const handleDutyBadgeClick = async (type: DutyType) => {
    if (!selectedDate) {
      toast.info('날짜를 먼저 선택해주세요.');
      return;
    }

    setSelectedDutyType(type);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const newShift = typeToShiftCode(type);
      let shiftToSend: 'D' | 'E' | 'N' | 'O' | 'M' | 'X' = newShift;

      // 동일한 근무를 누른 경우 삭제하지 않고 그대로 유지
      const isUpdating = currentShift !== newShift;

      // 동일한 근무를 누른 경우에는 서버 업데이트 없이 다음 날짜로만 이동
      if (isUpdating) {
        // 서버 호출 전에 로컬 상태를 즉시 업데이트
        if (dutyData && setMyDutyData) {
          const dayIdx = selectedDate.getDate() - 1;
          const newShifts = [...dutyData.shifts];
          newShifts[dayIdx] = shiftToSend;
          setMyDutyData({
            ...dutyData,
            shifts: newShifts.join(''),
          });
        }

        // 서버에 API 호출
        await dutyService.updateMyDuty({
          year,
          month,
          day,
          shift: shiftToSend,
        });

        // 토스트 메시지 제거 (모바일 및 데스크톱)
      } else {
        // 동일한 근무를 누른 경우, 토스트 메시지도 표시하지 않음
      }

      // 전체 데이터 갱신
      if (onDutyUpdated) {
        await onDutyUpdated();
      }

      // 다음 날짜로 이동 - 모바일, 웹 동일하게 적용 (동일한 근무를 눌러도 다음 날짜로 이동)
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(nextDate);
    } catch (error) {
      toast.error('근무 입력에 실패했습니다.');
    }
  };

  // 근무 삭제 함수
  const handleDeleteDuty = async () => {
    if (!selectedDate) {
      toast.info('날짜를 먼저 선택해주세요.');
      return;
    }

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const shiftToSend: 'X' = 'X'; // 항상 X로 설정하여 삭제

      // 서버 호출 전에 로컬 상태를 즉시 업데이트
      if (dutyData && setMyDutyData) {
        const dayIdx = selectedDate.getDate() - 1;
        const newShifts = [...dutyData.shifts];
        newShifts[dayIdx] = shiftToSend;
        setMyDutyData({
          ...dutyData,
          shifts: newShifts.join(''),
        });
      }

      // 서버에 API 호출
      await dutyService.updateMyDuty({ year, month, day, shift: shiftToSend });

      // 전체 데이터 갱신
      if (onDutyUpdated) {
        await onDutyUpdated();
      }

      // 다음 날짜로 이동
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(nextDate);
    } catch (error) {
      toast.error('근무 삭제에 실패했습니다.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-start justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        ref={modalRef}
        className={`
          work-crud-modal relative bg-white w-full
          ${
            isMobile
              ? 'rounded-t-2xl shadow-2xl max-w-full pb-4 pt-2 px-4 animate-slideup max-h-[60vh] overflow-y-auto'
              : 'rounded-2xl shadow-xl max-w-fit p-3 animate-fadeIn backdrop-blur-sm border border-gray-100'
          }
          flex flex-col items-center
          z-50
        `}
        style={
          isMobile
            ? { bottom: 0, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }
            : {
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
                position: 'absolute',
                left: modalPosition.left,
                top: modalPosition.top,
                minWidth: isVerticalMode ? 'auto' : '500px',
              }
        }
        onTouchEnd={handleTouchEnd}
      >
        {/* 가로/세로 모드 전환 버튼 (데스크톱만) */}
        {!isMobile && (
          <div
            className="absolute -right-3 -bottom-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md text-gray-500 hover:text-gray-700 z-10 cursor-pointer"
            onClick={toggleLayout}
          >
            <FaArrowRightArrowLeft size={16} />
          </div>
        )}

        {/* 오른쪽 상단 X 닫기 버튼 */}
        <button
          onClick={onClose}
          className={`absolute ${isMobile ? 'top-4 right-4' : '-right-3 -top-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md text-gray-500 hover:text-gray-700'} z-10`}
          aria-label="닫기"
        >
          <svg
            width={isMobile ? '24' : '16'}
            height={isMobile ? '24' : '16'}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-500"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className={`w-full ${isMobile ? 'mt-6' : 'mt-1'} ${isMobile ? 'mb-2' : 'mb-0'} ${isMobile ? 'p-1' : 'p-2'} rounded-lg bg-white flex ${isMobile ? 'flex-col' : isVerticalMode ? 'flex-col' : 'flex-row'} items-center justify-center shrink-0`}
        >
          {isMobile ? (
            // 모바일 레이아웃
            <>
              <div className="flex flex-row justify-center gap-2 mb-2 w-full">
                {(['day', 'off'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDutyBadgeClick(type)}
                    className={`rounded-[13px] focus:outline-none transition-all border-1 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
                    style={{
                      lineHeight: 0,
                      ...(selectedDutyType === type
                        ? ({
                            '--tw-ring-color': dutyColors[type].bg,
                          } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <DutyBadgeKor
                      type={type}
                      size="sm"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
              </div>
              <div className="flex flex-row justify-center gap-2 w-full">
                {(['evening', 'night', 'mid'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDutyBadgeClick(type)}
                    className={`rounded-[13px] focus:outline-none transition-all border-1 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
                    style={{
                      lineHeight: 0,
                      ...(selectedDutyType === type
                        ? ({
                            '--tw-ring-color': dutyColors[type].bg,
                          } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <DutyBadgeKor
                      type={type}
                      size="sm"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
              </div>
              {/* 모바일에 "없음" 뱃지 추가 */}
              <div className="flex flex-row justify-center gap-2 mt-2 w-full">
                <button
                  key="empty"
                  type="button"
                  onClick={handleDeleteDuty}
                  className={`rounded-[13px] focus:outline-none transition-all border-1 border-transparent`}
                  style={{ lineHeight: 0 }}
                >
                  <EmptyBadge />
                </button>
              </div>
            </>
          ) : isVerticalMode ? (
            // 데스크톱 세로 모드
            <>
              {/* 세로 모드 드래그 핸들 */}
              <div
                className="w-full flex justify-center mb-2 cursor-move"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-500"
                >
                  <path
                    d="M8 6C8 7.10457 7.10457 8 6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4C7.10457 4 8 4.89543 8 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M8 18C8 19.1046 7.10457 20 6 20C4.89543 20 4 19.1046 4 18C4 16.8954 4.89543 16 6 16C7.10457 16 8 16.8954 8 18Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4C13.1046 4 14 4.89543 14 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 6C20 7.10457 19.1046 8 18 8C16.8954 8 16 7.10457 16 6C16 4.89543 16.8954 4 18 4C19.1046 4 20 4.89543 20 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 12C20 13.1046 19.1046 14 18 14C16.8954 14 16 13.1046 16 12C16 10.8954 16.8954 10 18 10C19.1046 10 20 10.8954 20 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 18C20 19.1046 19.1046 20 18 20C16.8954 20 16 19.1046 16 18C16 16.8954 16.8954 16 18 16C19.1046 16 20 16.8954 20 18Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex flex-col items-center justify-center w-full gap-2.5">
                {dutyTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDutyBadgeClick(type)}
                    className={`rounded-[13px] focus:outline-none transition-all border-1 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
                    style={{
                      lineHeight: 0,
                      ...(selectedDutyType === type
                        ? ({
                            '--tw-ring-color': dutyColors[type].bg,
                          } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <DutyBadgeKor
                      type={type}
                      size="sm"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
                <button
                  key="empty"
                  type="button"
                  onClick={handleDeleteDuty}
                  className={`rounded-[13px] focus:outline-none transition-all border-1 border-transparent`}
                  style={{ lineHeight: 0 }}
                >
                  <EmptyBadge />
                </button>
              </div>
            </>
          ) : (
            // 데스크톱 가로 모드
            <div className="flex flex-row items-center justify-center w-full px-2">
              {/* 가로 모드 드래그 핸들 */}
              <div
                className="cursor-move mr-4 flex-shrink-0"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-500"
                >
                  <path
                    d="M8 6C8 7.10457 7.10457 8 6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4C7.10457 4 8 4.89543 8 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M8 18C8 19.1046 7.10457 20 6 20C4.89543 20 4 19.1046 4 18C4 16.8954 4.89543 16 6 16C7.10457 16 8 16.8954 8 18Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4C13.1046 4 14 4.89543 14 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 6C20 7.10457 19.1046 8 18 8C16.8954 8 16 7.10457 16 6C16 4.89543 16.8954 4 18 4C19.1046 4 20 4.89543 20 6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 12C20 13.1046 19.1046 14 18 14C16.8954 14 16 13.1046 16 12C16 10.8954 16.8954 10 18 10C19.1046 10 20 10.8954 20 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20 18C20 19.1046 19.1046 20 18 20C16.8954 20 16 19.1046 16 18C16 16.8954 16.8954 16 18 16C19.1046 16 20 16.8954 20 18Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex flex-row flex-wrap justify-center items-center gap-2.5 overflow-x-auto">
                {dutyTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDutyBadgeClick(type)}
                    className={`rounded-[13px] focus:outline-none transition-all border-1 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
                    style={{
                      lineHeight: 0,
                      ...(selectedDutyType === type
                        ? ({
                            '--tw-ring-color': dutyColors[type].bg,
                          } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <DutyBadgeKor
                      type={type}
                      size="sm"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
                <button
                  key="empty"
                  type="button"
                  onClick={handleDeleteDuty}
                  className={`rounded-[13px] focus:outline-none transition-all border-1 border-transparent`}
                  style={{ lineHeight: 0 }}
                >
                  <EmptyBadge />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkCRUDModal;
