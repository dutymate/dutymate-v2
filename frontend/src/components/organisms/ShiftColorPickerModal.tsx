import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
type DutyType = (typeof dutyTypes)[number];

const badgeLabels: Record<DutyType, string> = {
  day: '데이',
  evening: '이브닝',
  night: '나이트',
  off: '오프',
  mid: '미드',
};

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
  const [localColors, setLocalColors] = useState<
    Record<DutyType, { bg: string; text: string }>
  >(dutyColors as any);
  const [activeType, setActiveType] = useState<DutyType>('day');
  const [activeTab, setActiveTab] = useState<'bg' | 'text'>('bg');

  useEffect(() => {
    onChange(localColors);
  }, [localColors, onChange]);

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
          <p className="text-sm text-gray-600 mb-2">
            미리보기 (클릭해서 색상 변경)
          </p>
          <div className="flex flex-wrap gap-2">
            {dutyTypes.map((type) => (
              <span
                key={type}
                className={`inline-flex items-center justify-center rounded-[9px] font-semibold whitespace-nowrap text-sm w-[48px] h-[28px] border cursor-pointer transition-all ${activeType === type ? 'ring-2 ring-gray-300' : 'border-gray-200'}`}
                style={{
                  background: localColors[type].bg,
                  color: localColors[type].text,
                }}
                onClick={() => {
                  setActiveType(type);
                  setActiveTab('bg');
                }}
              >
                {badgeLabels[type]}
              </span>
            ))}
          </div>
        </div>

        {/* 색상 선택 영역: 한 dutyType만, 탭으로 배경/텍스트 전환 */}
        <div className="px-6 py-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${activeTab === 'bg' ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-gray-200'}`}
                onClick={() => setActiveTab('bg')}
              >
                배경색
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${activeTab === 'text' ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-gray-200'}`}
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
            onClick={onClose}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftColorPickerModal;
