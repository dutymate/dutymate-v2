import React, { useState, useEffect } from 'react';
import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { getDutyColors } from '@/utils/dutyUtils';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { dutyService } from '@/services/dutyService';
import { toast } from 'react-toastify';

interface WorkCRUDModalProps {
  open: boolean;
  onClose: () => void;
}

const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
type DutyType = (typeof dutyTypes)[number];

const WorkCRUDModal = ({ open, onClose }: WorkCRUDModalProps) => {
  const [selectedDutyType, setSelectedDutyType] = useState<DutyType>('day');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { userInfo } = useUserAuthStore();
  const dutyColors = getDutyColors(userInfo?.color);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 근무 입력(서버 반영) 함수
  const handleDutyBadgeClick = async (type: DutyType) => {
    setSelectedDutyType(type);
    // 실제 서버 반영 로직은 필요에 따라 추가 (예시: 오늘 날짜에 대해 근무 입력)
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const dutyTypeToShiftMap: Record<DutyType, 'D' | 'E' | 'N' | 'O' | 'M'> =
        {
          day: 'D',
          evening: 'E',
          night: 'N',
          off: 'O',
          mid: 'M',
        };
      const shift = dutyTypeToShiftMap[type];
      // 예시: 오늘 날짜에 근무 입력
      await dutyService.updateMyDuty({ year, month, day, shift });
      toast.success(`${month}월 ${day}일 근무가 ${type}으로 입력되었습니다.`);
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
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${
            isMobile
              ? 'max-w-full pb-4 pt-2 px-4 animate-slideup'
              : 'max-w-sm p-5'
          }
          flex flex-col items-center
          z-10
        `}
        style={isMobile ? { bottom: 0 } : {}}
      >
        {/* 닫기 버튼 */}
        <button
          className="absolute top-3 right-3 text-gray-400 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 mt-1 w-full text-center">
          근무 입력
        </h2>
        <div
          className={`w-full ${isMobile ? 'mb-2 p-1 rounded-lg' : 'mb-3 p-3 rounded-xl'} bg-white flex ${isMobile ? 'flex-row justify-center gap-1' : 'flex-col items-center justify-center'} shrink-0`}
        >
          {isMobile ? (
            <div className="flex flex-row flex-wrap justify-center gap-1 w-full">
              {dutyTypes.map((type) => (
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
                    size="xxs"
                    bgColor={dutyColors[type].bg}
                    textColor={dutyColors[type].text}
                  />
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-2">
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
                      size="xxs"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-2">
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
                      size="xxs"
                      bgColor={dutyColors[type].bg}
                      textColor={dutyColors[type].text}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default WorkCRUDModal;
