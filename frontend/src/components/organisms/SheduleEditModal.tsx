import { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

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
  currentScheduleCount?: number;
}

interface Marker {
  position: {
    lat: number;
    lng: number;
  };
  content: string;
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
  currentScheduleCount = 0,
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
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Marker | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [isDirectPlaceInput, setIsDirectPlaceInput] = useState(false);

  // 장소 검색 함수
  const searchPlaces = (keyword: string) => {
    if (!map || !window.kakao?.maps?.services?.Places) return;
    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers: Marker[] = [];
        for (let i = 0; i < data.length; i++) {
          newMarkers.push({
            position: {
              lat: Number(data[i].y),
              lng: Number(data[i].x),
            },
            content: data[i].place_name,
          });
          bounds.extend(
            new window.kakao.maps.LatLng(Number(data[i].y), Number(data[i].x))
          );
        }
        setMarkers(newMarkers);
        map.setBounds(bounds);
      } else {
        setMarkers([]);
      }
      setIsSearching(false);
    });
  };

  // Enter 키로 검색 실행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchKeyword.trim()) {
      setPendingKeyword(searchKeyword.trim());
    }
  };

  // pendingKeyword가 바뀔 때만 검색 실행
  useEffect(() => {
    if (pendingKeyword && map) {
      searchPlaces(pendingKeyword);
    }
  }, [pendingKeyword, map]);

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
  const MAX_SCHEDULES_PER_DAY = 10;
  const handleSave = () => {
    if (mode === 'create' && currentScheduleCount >= MAX_SCHEDULES_PER_DAY) {
      alert('하루에 최대 10개의 메모만 추가할 수 있습니다.');
      return;
    }
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
        className="bg-white rounded-xl shadow-2xl w-[90%] sm:w-80 overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className={
            'bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex justify-between items-center'
          }
        >
          <h2 className="text-base sm:text-lg font-bold text-primary">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 text-lg sm:text-xl rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* 본문 */}
        <div className="p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3 sm:space-y-4">
            {/* 제목 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${isEditable ? 'border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200' : 'bg-gray-50 border-gray-200 pointer-events-none select-none'} transition-all text-sm`}
                placeholder="일정 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!isEditable}
                tabIndex={isEditable ? 0 : -1}
              />
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-2 relative">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <div
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex items-center ${isEditable ? 'border-gray-300 cursor-pointer' : 'bg-gray-50 border-gray-200'}`}
                  onClick={
                    isEditable ? () => setActiveTimePicker('start') : undefined
                  }
                >
                  <span className="mr-1 text-sm">⏰</span>
                  <span className="text-sm">{startTime}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <div
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex items-center ${isEditable ? 'border-gray-300 cursor-pointer' : 'bg-gray-50 border-gray-200'}`}
                  onClick={
                    isEditable ? () => setActiveTimePicker('end') : undefined
                  }
                >
                  <span className="mr-1 text-sm">⏰</span>
                  <span className="text-sm">{endTime}</span>
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                색상
              </label>
              {isEditable ? (
                <div className="flex flex-wrap gap-1">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${opt.bg} flex items-center justify-center ${color === opt.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      onClick={() => setColor(opt.value)}
                      title={opt.name}
                    >
                      {color === opt.value && (
                        <span className="text-white text-[10px] sm:text-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center">
                  <span
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${colorOptions.find((c) => c.value === color)?.dot || 'bg-blue-500'} mr-2`}
                  ></span>
                  <span className="text-sm">
                    {colorOptions.find((c) => c.value === color)?.name ||
                      '기본'}
                  </span>
                </div>
              )}
            </div>

            {/* 장소 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                장소
              </label>
              <div className="space-y-2">
                {isEditable && (
                  <div className="flex gap-2 mb-1">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-xs border ${!isDirectPlaceInput ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary'}`}
                      onClick={() => setIsDirectPlaceInput(false)}
                    >
                      장소 검색
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-xs border ${isDirectPlaceInput ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary'}`}
                      onClick={() => setIsDirectPlaceInput(true)}
                    >
                      직접 입력
                    </button>
                  </div>
                )}
                {isEditable && isDirectPlaceInput ? (
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="장소를 직접 입력하세요"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                  />
                ) : (
                  <div
                    className={`flex items-center w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${isEditable ? 'border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                    style={{
                      cursor:
                        isEditable && !isDirectPlaceInput
                          ? 'pointer'
                          : 'default',
                    }}
                  >
                    <span className="mr-1 text-sm">📍</span>
                    <input
                      type="text"
                      className={`w-full text-sm ${isEditable ? 'focus:outline-none' : 'bg-gray-50 pointer-events-none select-none'}`}
                      placeholder="장소를 입력하세요"
                      value={place}
                      onChange={(e) => {
                        setPlace(e.target.value);
                        setSearchKeyword(e.target.value);
                        setIsPlaceSearchOpen(true);
                      }}
                      readOnly={!isEditable || isDirectPlaceInput}
                      tabIndex={isEditable ? 0 : -1}
                      onFocus={() => isEditable && setIsPlaceSearchOpen(true)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}
                {isEditable && isPlaceSearchOpen && !isDirectPlaceInput && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div style={{ width: '100%', height: '250px' }}>
                      <Map
                        center={{
                          lat: 37.566826,
                          lng: 126.9786567,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        level={3}
                        onCreate={setMap}
                      >
                        {markers.map((marker) => (
                          <MapMarker
                            key={`marker-${marker.content}-${marker.position.lat},${marker.position.lng}`}
                            position={marker.position}
                            onClick={() => {
                              setSelectedPlace(marker);
                              setPlace(marker.content);
                              setIsPlaceSearchOpen(false);
                            }}
                          >
                            {selectedPlace &&
                              selectedPlace.content === marker.content && (
                                <div className="p-2 bg-white rounded-lg shadow-lg">
                                  {marker.content}
                                </div>
                              )}
                          </MapMarker>
                        ))}
                      </Map>
                      {isSearching && (
                        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="mb-2">장소를 검색하는 중...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-4 sm:mt-5 space-y-2">
            {isCreate && (
              <button
                className="w-full py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base bg-white border border-primary text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                onClick={handleSave}
                disabled={currentScheduleCount >= MAX_SCHEDULES_PER_DAY}
                style={
                  currentScheduleCount >= MAX_SCHEDULES_PER_DAY
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
                }
              >
                저장
              </button>
            )}

            {currentScheduleCount >= MAX_SCHEDULES_PER_DAY &&
              mode === 'create' && (
                <div className="text-xs text-red-500 mt-1 text-center">
                  하루에 최대 10개의 메모만 추가할 수 있습니다.
                </div>
              )}

            {isView && (
              <>
                <button
                  className="w-full py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base bg-white border border-primary text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                  onClick={onEdit}
                >
                  수정
                </button>
                <button
                  className="w-full py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-sm sm:text-base shadow-sm hover:bg-gray-100 transition-colors"
                  onClick={onDelete}
                >
                  삭제
                </button>
              </>
            )}

            {isEdit && (
              <>
                <button
                  className="w-full py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base bg-white border border-primary text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                  onClick={handleSave}
                >
                  저장
                </button>
                <button
                  className="w-full py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-sm sm:text-base shadow-sm hover:bg-gray-100 transition-colors"
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
