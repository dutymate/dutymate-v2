import { useState, useEffect } from 'react';

interface ScheduleEditModalProps {
  mode: 'create' | 'view' | 'edit';
  initialData?: {
    title: string;
    startTime: string;
    endTime: string;
    color: string;
    place: string;
  };
  onClose: () => void;
  onSave?: (data: Omit<any, 'id'>) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const ScheduleEditModal = ({
  mode = 'create',
  initialData = {
    title: '',
    startTime: '오전 09:00',
    endTime: '오전 10:00',
    color: 'blue',
    place: '',
  },
  onClose = () => {},
  onSave = () => {},
  onDelete = () => {},
  onEdit = () => {},
}: ScheduleEditModalProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(
    initialData?.startTime || '오전 09:00'
  );
  const [endTime, setEndTime] = useState(initialData?.endTime || '오전 10:00');
  const [color, setColor] = useState(initialData?.color || 'blue');
  const [place, setPlace] = useState(initialData?.place || '');
  const [activeTimePicker, setActiveTimePicker] = useState<
    null | 'start' | 'end'
  >(null);

  // 색상 옵션 정의 - 더 다양하고 현대적인 색상으로 업데이트
  const colorOptions = [
    { name: '블루', value: 'blue', bg: 'bg-blue-500', dot: 'bg-blue-500' },
    {
      name: '퍼플',
      value: 'purple',
      bg: 'bg-purple-500',
      dot: 'bg-purple-500',
    },
    { name: '그린', value: 'green', bg: 'bg-green-500', dot: 'bg-green-500' },
    { name: '핑크', value: 'pink', bg: 'bg-pink-500', dot: 'bg-pink-500' },
    { name: '레드', value: 'red', bg: 'bg-red-500', dot: 'bg-red-500' },
    {
      name: '옐로우',
      value: 'yellow',
      bg: 'bg-yellow-400',
      dot: 'bg-yellow-400',
    },
    {
      name: '토마토',
      value: 'tomato',
      bg: 'bg-orange-500',
      dot: 'bg-orange-500',
    },
    {
      name: '인디고',
      value: 'indigo',
      bg: 'bg-indigo-500',
      dot: 'bg-indigo-500',
    },
  ];

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';
  const isEditable = isCreate || isEdit;

  const TimePicker = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
    onClose: () => void;
  }) => {
    const [period, setPeriod] = useState<'오전' | '오후'>(
      value.includes('오전') ? '오전' : '오후'
    );
    const timeParts = value.split(' ')[1].split(':');
    const [hour, setHour] = useState<string>(timeParts[0]);
    const [minute, setMinute] = useState<string>(timeParts[1]);
    const [activeDropdown, setActiveDropdown] = useState<
      'period' | 'hour' | 'minute' | null
    >(null);

    useEffect(() => {
      const hourStr = String(hour).padStart(2, '0');
      onChange(`${period} ${hourStr}:${minute}`);
    }, [period, hour, minute]);

    const CustomDropdown = ({
      options,
      value,
      onChange,
      type,
    }: {
      options: string[];
      value: string;
      onChange: (value: string) => void;
      type: 'period' | 'hour' | 'minute';
      label: string;
    }) => {
      const isActive = activeDropdown === type;

      return (
        <div className="relative w-1/3">
          <div
            className="border border-green-500 rounded-full px-4 py-2 bg-white cursor-pointer flex items-center justify-between"
            onClick={() => setActiveDropdown(isActive ? null : type)}
          >
            <span>{value}</span>
            <span className="text-gray-500">▼</span>
          </div>

          {isActive && (
            <div
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {options.map((option) => (
                <div
                  key={option}
                  className={`px-4 py-2 hover:bg-green-50 cursor-pointer ${
                    value === option ? 'bg-green-100' : ''
                  }`}
                  onClick={() => {
                    onChange(option);
                    setActiveDropdown(null);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className="absolute z-10 bg-white rounded-lg shadow-xl p-4 border border-gray-200 w-full mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center space-x-2">
          <CustomDropdown
            options={['오전', '오후']}
            value={period}
            onChange={(value) => setPeriod(value as '오전' | '오후')}
            type="period"
            label="오전/오후"
          />

          <CustomDropdown
            options={Array.from({ length: 12 }, (_, i) =>
              String(i + 1).padStart(2, '0')
            )}
            value={hour}
            onChange={setHour}
            type="hour"
            label="시"
          />

          <CustomDropdown
            options={[
              '00',
              '05',
              '10',
              '15',
              '20',
              '25',
              '30',
              '35',
              '40',
              '45',
              '50',
              '55',
            ]}
            value={minute}
            onChange={setMinute}
            type="minute"
            label="분"
          />
        </div>
      </div>
    );
  };

  // 외부 클릭 감지하여 타임피커 닫기
  useEffect(() => {
    if (!activeTimePicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.time-picker-container')) {
        setActiveTimePicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTimePicker]);

  // 저장 처리
  const handleSave = () => {
    onSave?.({ title, startTime, endTime, color, place });
  };

  // 모달 타이틀
  const modalTitle = isCreate
    ? '새 일정 추가'
    : isView
      ? '일정 보기'
      : '일정 수정';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className={
            'bg-primary-30 px-6 py-2 text-white flex justify-between items-center'
          }
        >
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="text-white text-2xl">
            &times;
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="space-y-5">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border ${isEditable ? 'border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200' : 'bg-gray-50 border-gray-200'} transition-all`}
                placeholder="일정 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!isEditable}
              />
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-3 relative">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <div
                  className={`w-full px-4 py-3 rounded-lg border flex items-center ${isEditable ? 'border-gray-300 cursor-pointer' : 'bg-gray-50 border-gray-200'}`}
                  onClick={
                    isEditable ? () => setActiveTimePicker('start') : undefined
                  }
                >
                  <span className="mr-2">⏰</span>
                  <span>{startTime}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <div
                  className={`w-full px-4 py-3 rounded-lg border flex items-center ${isEditable ? 'border-gray-300 cursor-pointer' : 'bg-gray-50 border-gray-200'}`}
                  onClick={
                    isEditable ? () => setActiveTimePicker('end') : undefined
                  }
                >
                  <span className="mr-2">⏰</span>
                  <span>{endTime}</span>
                </div>
              </div>
              {isEditable && activeTimePicker && (
                <div className="absolute left-0 top-full w-full z-20 time-picker-container">
                  <TimePicker
                    value={activeTimePicker === 'start' ? startTime : endTime}
                    onChange={(v: string) => {
                      if (activeTimePicker === 'start') setStartTime(v);
                      else setEndTime(v);
                    }}
                    onClose={() => setActiveTimePicker(null)}
                  />
                </div>
              )}
            </div>

            {/* 색상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                색상
              </label>
              {isEditable ? (
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${opt.bg} flex items-center justify-center ${color === opt.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      onClick={() => setColor(opt.value)}
                      title={opt.name}
                    >
                      {color === opt.value && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center">
                  <span
                    className={`w-5 h-5 rounded-full ${colorOptions.find((c) => c.value === color)?.dot || 'bg-blue-500'} mr-2`}
                  ></span>
                  <span>
                    {colorOptions.find((c) => c.value === color)?.name ||
                      '기본'}
                  </span>
                </div>
              )}
            </div>

            {/* 장소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                장소
              </label>
              <div
                className={`flex items-center w-full px-4 py-3 rounded-lg border ${isEditable ? 'border-gray-300' : 'bg-gray-50 border-gray-200'}`}
              >
                <span className="mr-2">📍</span>
                <input
                  type="text"
                  className={`w-full ${isEditable ? 'focus:outline-none' : 'bg-gray-50'}`}
                  placeholder="장소를 입력하세요"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-8 space-y-3">
            {isCreate && (
              <button
                className="w-full py-2 rounded-lg font-bold text-lg bg-primary-30 text-white"
                onClick={handleSave}
              >
                저장
              </button>
            )}

            {isView && (
              <>
                <button
                  className="w-full py-2 rounded-lg font-bold text-lg bg-primary-30 text-white"
                  onClick={onEdit}
                >
                  수정
                </button>
                <button
                  className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg border border-gray-300"
                  onClick={onDelete}
                >
                  삭제
                </button>
              </>
            )}

            {isEdit && (
              <>
                <button
                  className="w-full py-2 rounded-lg font-bold text-lg bg-primary-30 text-white"
                  onClick={handleSave}
                >
                  저장
                </button>
                <button
                  className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg border border-gray-300"
                  onClick={onDelete}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditModal;
