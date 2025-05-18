import React, { useState, useEffect } from 'react';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { getDutyColors } from '@/utils/dutyUtils';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { dutyService, MyDuty } from '@/services/dutyService';
import { toast } from 'react-toastify';
import { IoMdClose } from 'react-icons/io';

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open && selectedDate) {
      const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const cell = document.querySelector(`[data-date='${dateKey}']`);
      const modal = document.querySelector('.work-crud-modal');
      if (cell && modal) {
        const cellRect = (cell as HTMLElement).getBoundingClientRect();
        const modalRect = (modal as HTMLElement).getBoundingClientRect();
        // 셀이 모달에 가려지면, gap이 너무 크지 않게 조정
        if (cellRect.bottom > modalRect.top) {
          // 셀의 bottom이 모달의 top보다 10px 이상 아래에 있으면, 그 차이만큼만 스크롤
          const gap = cellRect.bottom - modalRect.top + 16; // 16px 여유
          window.scrollBy({ top: gap, behavior: 'smooth' });
        } else if (modalRect.top - cellRect.bottom > 80) {
          // gap이 너무 크면(80px 이상) 셀을 모달 바로 위로 오게 스크롤
          const gap = modalRect.top - cellRect.bottom - 40; // 40px 여유
          window.scrollBy({ top: -gap, behavior: 'smooth' });
        }
      }
    }
  }, [open, selectedDate]);

  // 근무 입력(서버 반영) 함수
  const handleDutyBadgeClick = async (type: DutyType) => {
    setSelectedDutyType(type);
    try {
      let today = new Date();
      if (selectedDate) {
        today = new Date(selectedDate);
      }
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const newShift = typeToShiftCode(type);
      let shiftToSend: 'D' | 'E' | 'N' | 'O' | 'M' | 'X' = newShift;
      if (currentShift === newShift) {
        shiftToSend = 'X'; // 같은 근무를 다시 누르면 삭제
      }

      // 서버 호출 전에 로컬 상태를 즉시 업데이트
      if (dutyData && setMyDutyData) {
        const dayIdx = today.getDate() - 1;
        const newShifts = [...dutyData.shifts];
        newShifts[dayIdx] = shiftToSend;
        setMyDutyData({
          ...dutyData,
          shifts: newShifts.join(''),
        });
      }

      // 서버에 API 호출
      await dutyService.updateMyDuty({ year, month, day, shift: shiftToSend });
      toast.success(
        `${month}월 ${day}일 근무가 ${shiftToSend === 'X' ? '삭제' : type + '으로 입력'}되었습니다.`
      );

      // 전체 데이터 갱신
      if (onDutyUpdated) {
        await onDutyUpdated();
      }

      // 다음 날짜로 이동
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 1);
      setSelectedDate(nextDate);
    } catch (error) {
      toast.error('근무 입력에 실패했습니다.');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`
          work-crud-modal relative bg-white rounded-t-2xl lg:rounded-2xl w-full
          ${
            isMobile
              ? 'shadow-2xl max-w-full pb-4 pt-2 px-4 animate-slideup max-h-[60vh] overflow-y-auto'
              : 'shadow-xl max-w-sm p-5 pb-8'
          }
          flex flex-col items-center
          z-10
        `}
        style={
          isMobile
            ? { bottom: 0, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }
            : {}
        }
      >
        {/* 오른쪽 상단 X 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="닫기"
        >
          <IoMdClose className="w-6 h-6 text-gray-500" />
        </button>
        <div
          className={`w-full mt-6 ${isMobile ? 'mb-2 p-1 rounded-lg' : 'mb-3 p-3 rounded-xl'} bg-white flex flex-col items-center justify-center shrink-0`}
        >
          <div className="flex flex-row justify-center gap-2 mb-2 w-full">
            {(['day', 'off'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDutyBadgeClick(type)}
                className={`rounded-lg focus:outline-none transition-all border-1 px-0.5 py-0.5 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
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
                className={`rounded-lg focus:outline-none transition-all border-1 px-0.5 py-0.5 ${selectedDutyType === type ? 'ring-2' : 'border-transparent'}`}
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
        </div>
      </div>
    </div>
  );
};

export default WorkCRUDModal;
