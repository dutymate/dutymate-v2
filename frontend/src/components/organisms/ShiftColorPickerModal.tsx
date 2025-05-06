import { useState, useEffect } from 'react';

const dutyTypes = ['day', 'off', 'evening', 'night', 'mid'] as const;
type DutyType = (typeof dutyTypes)[number];

// 파스텔톤 위주의 확장된 색상 옵션
const colorOptions: Record<
  DutyType,
  { className: string; hex: string; text?: string }[]
> = {
  day: [
    { className: 'bg-duty-day-bg', hex: '#dcfce7' },
    { className: 'bg-green-100', hex: '#dcfce7', text: 'text-green-700' },
    { className: 'bg-emerald-100', hex: '#d1fae5', text: 'text-emerald-700' },
    { className: 'bg-lime-100', hex: '#f7fee7', text: 'text-lime-700' },
    { className: 'bg-green-200', hex: '#bbf7d0', text: 'text-green-800' },
    { className: 'bg-emerald-200', hex: '#a7f3d0', text: 'text-emerald-800' },
  ],
  off: [
    { className: 'bg-base-white', hex: '#f3f4f6' },
    { className: 'bg-gray-200', hex: '#e5e7eb' },
    { className: 'bg-slate-100', hex: '#f1f5f9' },
    { className: 'bg-zinc-100', hex: '#f4f4f5' },
    { className: 'bg-stone-100', hex: '#f5f5f4' },
    { className: 'bg-neutral-200', hex: '#e5e5e5' },
  ],
  evening: [
    { className: 'bg-duty-evening-bg', hex: '#fee2e2' },
    { className: 'bg-red-200', hex: '#fecaca' },
    { className: 'bg-pink-100', hex: '#fce7f3' },
    { className: 'bg-rose-100', hex: '#ffe4e6' },
    { className: 'bg-orange-100', hex: '#ffedd5' },
    { className: 'bg-red-300', hex: '#fca5a5' },
  ],
  night: [
    { className: 'bg-duty-night-bg', hex: '#e0e7ff' },
    { className: 'bg-indigo-200', hex: '#c7d2fe' },
    { className: 'bg-purple-100', hex: '#f3e8ff' },
    { className: 'bg-violet-100', hex: '#ede9fe' },
    { className: 'bg-fuchsia-100', hex: '#fae8ff' },
    { className: 'bg-indigo-300', hex: '#a5b4fc' },
  ],
  mid: [
    { className: 'bg-duty-mid-bg', hex: '#dbeafe' },
    { className: 'bg-blue-200', hex: '#bfdbfe' },
    { className: 'bg-sky-100', hex: '#e0f2fe' },
    { className: 'bg-cyan-100', hex: '#cffafe' },
    { className: 'bg-lightBlue-100', hex: '#e0f7ff' },
    { className: 'bg-blue-300', hex: '#93c5fd' },
  ],
};

const badgeLabels: Record<DutyType, string> = {
  day: '데이',
  evening: '이브닝',
  night: '나이트',
  off: '오프',
  mid: '미드',
};

// 배경색 클래스명에 따라 텍스트 색상 매핑 함수
function getTextColorClass(bgClass: string) {
  if (
    bgClass.includes('gray') ||
    bgClass.includes('base-white') ||
    bgClass.includes('lime') ||
    bgClass.includes('yellow') ||
    bgClass.includes('sky') ||
    bgClass.includes('lightBlue')
  ) {
    return 'text-gray-800';
  }
  if (bgClass.includes('green')) {
    return 'text-green-800';
  }
  if (
    bgClass.includes('red') ||
    bgClass.includes('rose') ||
    bgClass.includes('pink') ||
    bgClass.includes('orange')
  ) {
    return 'text-red-800';
  }
  if (
    bgClass.includes('blue') ||
    bgClass.includes('indigo') ||
    bgClass.includes('cyan')
  ) {
    return 'text-blue-800';
  }
  if (
    bgClass.includes('purple') ||
    bgClass.includes('violet') ||
    bgClass.includes('fuchsia')
  ) {
    return 'text-purple-800';
  }
  return 'text-gray-900'; // fallback
}

// DutyType별 첫 번째 색상 className
const firstColorClass: Record<DutyType, string> = {
  day: colorOptions.day[0].className,
  off: colorOptions.off[0].className,
  evening: colorOptions.evening[0].className,
  night: colorOptions.night[0].className,
  mid: colorOptions.mid[0].className,
};

// DutyType별 첫 번째 색상일 때 텍스트 색상 className
const firstTextColorClass: Record<DutyType, string> = {
  day: 'text-duty-day', // 초록
  off: 'text-duty-off', // 회색
  evening: 'text-duty-evening', // 빨강
  night: 'text-duty-night', // 보라
  mid: 'text-duty-mid', // 파랑
};

// DutyBadgeKor 수정
const DutyBadgeKorLike = ({
  type,
  colorClass,
  textClass,
}: { type: DutyType; colorClass: string; textClass?: string }) => {
  const textColorClass = textClass
    ? textClass
    : colorClass === firstColorClass[type]
      ? firstTextColorClass[type]
      : getTextColorClass(colorClass);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-[9px] font-semibold whitespace-nowrap
        text-sm w-[48px] h-[28px]
        ${colorClass}
        ${textColorClass}
        ${type === 'off' ? 'border border-duty-off' : ''}
      `}
      style={{ lineHeight: 1.2 }}
    >
      {badgeLabels[type]}
    </span>
  );
};

interface ShiftColorPickerModalProps {
  open: boolean;
  onClose: () => void;
  dutyColors: Record<DutyType, string>;
  onChange: (newColors: Record<DutyType, string>) => void;
}

const ShiftColorPickerModal = ({
  open,
  onClose,
  dutyColors,
  onChange,
}: ShiftColorPickerModalProps) => {
  const [localColors, setLocalColors] =
    useState<Record<DutyType, string>>(dutyColors);

  // 선택한 색상이 변경될 때마다 부모에게 통지
  useEffect(() => {
    onChange(localColors);
  }, [localColors, onChange]);

  if (!open) return null;

  const handleColorSelect = (type: DutyType, colorClass: string) => {
    setLocalColors((prev) => ({ ...prev, [type]: colorClass }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-96 max-w-full mx-4 h-[30rem] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-primary-30 text-white px-6 py-2 flex justify-between items-center">
          <h2 className="text-xl font-bold">근무 색상 변경</h2>
          <button
            className="text-white text-2xl rounded-full  w-8 h-8 flex items-center justify-center"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 미리보기 영역 */}
        <div className="px-6 pt-4 pb-2 bg-gray-50 border-b">
          <p className="text-sm text-gray-600 mb-2">미리보기</p>
          <div className="flex flex-wrap gap-2">
            {dutyTypes.map((type) => (
              <DutyBadgeKorLike
                key={type}
                type={type}
                colorClass={localColors[type]}
              />
            ))}
          </div>
        </div>

        {/* 색상 선택 영역 */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-6">
            {dutyTypes.map((type) => (
              <div
                key={type}
                className="pb-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3 mb-3">
                  <DutyBadgeKorLike
                    type={type}
                    colorClass={localColors[type]}
                  />
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {colorOptions[type].map((color, idx) => (
                    <button
                      key={idx}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${color.className} hover:opacity-90 transition-all
                        ${
                          localColors[type] === color.className
                            ? 'ring-2 ring-offset-2 ring-blue-500'
                            : 'border border-gray-200'
                        }`}
                      onClick={() => handleColorSelect(type, color.className)}
                      title={color.hex}
                    >
                      {localColors[type] === color.className && (
                        <span className="text-gray-800">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            className="w-full py-3 rounded-lg bg-primary-30 text-white font-bold hover:bg-primary-40 transition-colors"
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
