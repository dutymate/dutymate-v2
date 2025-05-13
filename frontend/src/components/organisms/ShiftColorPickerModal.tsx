import { DutyBadgeKor } from '@/components/atoms/DutyBadgeKor';
import { dutyService } from '@/services/dutyService';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { DEFAULT_DUTY_COLORS } from '@/utils/dutyUtils';
import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'react-toastify';
import { Icon } from '../atoms/Icon';

const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
type DutyType = (typeof dutyTypes)[number];

interface ShiftColorPickerModalProps {
  open: boolean;
  onClose: () => void;
  dutyColors: Record<DutyType, { bg: string; text: string }>;
  onChange: (newColors: Record<DutyType, { bg: string; text: string }>) => void;
}

const ShiftColorPickerModal = ({
  open,
  onClose,
  dutyColors,
  onChange,
}: ShiftColorPickerModalProps) => {
  const [localColors, setLocalColors] =
    useState<Record<DutyType, { bg: string; text: string }>>(dutyColors);
  const [activeType, setActiveType] = useState<DutyType>('day');
  const [activeTab, setActiveTab] = useState<'bg' | 'text'>('bg');
  const { userInfo, setUserInfo } = useUserAuthStore();

  useEffect(() => {
    if (open) {
      setLocalColors(dutyColors);
    }
  }, [dutyColors, open]);

  if (!open) return null;

  const handleColorSelect = (
    type: DutyType,
    color: string,
    mode: 'bg' | 'text'
  ) => {
    setLocalColors((prev) => ({
      ...prev,
      [type]: { ...prev[type], [mode]: color },
    }));
  };

  const handleSaveColors = async () => {
    try {
      onChange(localColors);

      const colorUpdate = {
        dayBg: localColors.day.bg.replace('#', ''),
        dayText: localColors.day.text.replace('#', ''),
        eveningBg: localColors.evening.bg.replace('#', ''),
        eveningText: localColors.evening.text.replace('#', ''),
        nightBg: localColors.night.bg.replace('#', ''),
        nightText: localColors.night.text.replace('#', ''),
        offBg: localColors.off.bg.replace('#', ''),
        offText: localColors.off.text.replace('#', ''),
        midBg: localColors.mid.bg.replace('#', ''),
        midText: localColors.mid.text.replace('#', ''),
      };

      if (userInfo) {
        setUserInfo({
          ...userInfo,
          color: colorUpdate,
        });
      }

      await dutyService.updateDutyColors(colorUpdate);
      toast.success('색상 설정이 저장되었습니다.');

      onClose();
    } catch (error) {
      toast.error('색상 저장에 실패했습니다.');
      console.error('Error saving colors:', error);
    }
  };

  const handleResetColor = () => {
    setLocalColors(DEFAULT_DUTY_COLORS);
    toast.success('기본 색상으로 초기화되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div
        className="bg-white rounded-xl shadow-2xl w-96 max-w-full mx-4 h-[32rem] max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary">근무 색상 변경</h2>
          <button
            className="text-gray-400 text-2xl rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 미리보기 영역 */}
        <div className="px-6 pt-4 pb-2 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 mb-2">
              미리보기 (클릭해서 색상 변경)
            </p>
            <button
              className="flex items-center gap-1 mb-2"
              onClick={handleResetColor}
            >
              <Icon name="reset" size={12} />
              <p className="text-xs text-gray-600">색상 초기화하기</p>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dutyTypes.map((type) => (
              <span
                key={type}
                className={`rounded-lg inline-flex items-center justify-center cursor-pointer transition-all px-0.5 py-0.5 border-1 ${
                  activeType === type ? 'ring-2' : 'border-gray-200'
                }`}
                style={
                  activeType === type
                    ? ({
                        '--tw-ring-color': localColors[type].bg,
                      } as React.CSSProperties)
                    : {}
                }
                onClick={() => {
                  setActiveType(type);
                  setActiveTab('bg');
                }}
              >
                <DutyBadgeKor
                  type={type}
                  size="xxs"
                  bgColor={localColors[type].bg}
                  textColor={localColors[type].text}
                />
              </span>
            ))}
          </div>
        </div>

        {/* 색상 선택 영역: 한 dutyType만, 탭으로 배경/텍스트 전환 */}
        <div className="px-6 py-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${
                  activeTab === 'bg'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-primary border-gray-200'
                }`}
                onClick={() => setActiveTab('bg')}
              >
                배경색
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${
                  activeTab === 'text'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-primary border-gray-200'
                }`}
                onClick={() => setActiveTab('text')}
              >
                텍스트 색상
              </button>
            </div>
            <div>
              {activeTab === 'bg' ? (
                <div className="w-full flex justify-center px-0 max-w-none">
                  <HexColorPicker
                    color={localColors[activeType].bg}
                    onChange={(color) =>
                      handleColorSelect(activeType, color, 'bg')
                    }
                    className="w-full"
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div className="w-full flex justify-center px-0 max-w-none">
                  <HexColorPicker
                    color={localColors[activeType].text}
                    onChange={(color) =>
                      handleColorSelect(activeType, color, 'text')
                    }
                    className="w-full"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <button
            className="w-full py-3 rounded-lg bg-white border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors shadow-sm"
            onClick={handleSaveColors}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftColorPickerModal;
