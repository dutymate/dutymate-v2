import { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { deleteCalendar as deleteCalendarService } from '@/services/calendarService';
import type { ScheduleType } from '@/services/calendarService';
import type { CalendarCreateRequest } from '@/services/calendarService';

interface ScheduleEditModalProps {
  mode: 'create' | 'view' | 'edit';
  initialData?: {
    calendarId?: number;
    title: string;
    startTime: string;
    endTime: string;
    color: string;
    place: string;
    isAllDay: boolean;
  };
  onClose: () => void;
  onSave?: (data: Omit<any, 'calendarId'>) => void;
  onDelete?: (calendarId: number) => void;
  onEdit?: (data: Omit<any, 'calendarId'>) => void;
  currentScheduleCount?: number;
  setSchedulesByDate: React.Dispatch<
    React.SetStateAction<Record<string, ScheduleType[]>>
  >;
  date: string;
}

interface Marker {
  position: {
    lat: number;
    lng: number;
  };
  content: string;
}

const MAX_SCHEDULES_PER_DAY = 10;

const ScheduleEditModal = ({
  mode = 'create',
  initialData = {
    title: '',
    startTime: '오전 09:00',
    endTime: '오전 10:00',
    color: 'FF43F3',
    place: '',
    isAllDay: false,
  },
  onClose = () => {},
  onSave = () => {},
  onDelete = () => {},
  onEdit = () => {},
  currentScheduleCount = 0,
  date,
}: ScheduleEditModalProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(
    toDisplayTime(initialData?.startTime || '오전 09:00')
  );
  const [endTime, setEndTime] = useState(
    toDisplayTime(initialData?.endTime || '오전 10:00')
  );
  const [color, setColor] = useState(initialData?.color || 'FF43F3');
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
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay || false);

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
    { name: '핑크', value: 'FF43F3', bg: 'bg-pink-400' },
    { name: '회색', value: '777777', bg: 'bg-gray-400' },
    { name: '블루', value: '3B82F6', bg: 'bg-blue-500' },
    { name: '퍼플', value: '8B5CF6', bg: 'bg-purple-500' },
    { name: '그린', value: '22C55E', bg: 'bg-green-500' },
    { name: '레드', value: 'EF4444', bg: 'bg-red-500' },
    { name: '옐로우', value: 'FACC15', bg: 'bg-yellow-400' },
    { name: '오렌지', value: 'FB923C', bg: 'bg-orange-400' },
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
  }) => {
    const [period, setPeriod] = useState<'오전' | '오후'>(
      value.includes('오전') ? '오전' : '오후'
    );
    const timeParts = value.split(' ')[1].split(':');
    const [hour, setHour] = useState<string>(timeParts[0]);
    const [minute, setMinute] = useState<string>(timeParts[1]);

    useEffect(() => {
      const hourStr = String(hour).padStart(2, '0');
      onChange(`${period} ${hourStr}:${minute}`);
    }, [period, hour, minute]);

    return (
      <div
        className="absolute z-10 bg-white rounded-lg shadow-xl p-4 border border-gray-200 w-full mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center space-x-2">
          <div className="flex-1">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '오전' | '오후')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="오전">오전</option>
              <option value="오후">오후</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {i + 1}시
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[
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
              ].map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </div>
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

  // 시간 문자열을 ISO 8601 형식으로 변환하는 함수 (백엔드 전송용)
  const convertToISOFormat = (timeStr: string) => {
    try {
      // 시간 파싱
      const [period, hm] = timeStr.split(' ');
      let [hour, minute] = hm.split(':').map(Number);

      if (period === '오후' && hour !== 12) hour += 12;
      if (period === '오전' && hour === 12) hour = 0;

      // date 파라미터를 파싱하여 사용
      if (!date || !date.includes('-')) {
        console.warn('유효하지 않은 날짜 형식:', date);
        // 오류 처리: 현재 날짜 사용
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      }

      // 여기서는 이미 YYYY-MM-DD 형식의 date 문자열을 직접 사용
      // 시간대 변환 이슈 없이 전달받은 날짜 그대로 사용
      console.log(
        `시간 변환: ${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      );

      return `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    } catch (error) {
      console.error('시간 변환 오류:', error, { timeStr, date });
      // 오류 발생 시 기본값 반환
      const now = new Date();
      return now.toISOString().slice(0, 19);
    }
  };

  // 저장 버튼 활성화 조건
  const isSaveDisabled =
    !title.trim() ||
    !color.trim() ||
    (isAllDay === false && (!startTime || !endTime));

  // 저장 처리
  const handleSave = async () => {
    if (mode === 'create' && currentScheduleCount >= MAX_SCHEDULES_PER_DAY) {
      alert('하루에 최대 10개의 메모만 추가할 수 있습니다.');
      return;
    }

    try {
      if (mode === 'edit' && initialData?.calendarId) {
        // Edit mode
        const editData = {
          title,
          date,
          place: place.trim() || '',
          color,
          isAllDay,
          ...(isAllDay
            ? {}
            : {
                startTime: convertToISOFormat(startTime),
                endTime: convertToISOFormat(endTime),
              }),
        };

        // 먼저 모달 닫고 (UI 반응성 향상)
        onClose();

        // 그 다음 parent에 수정 요청
        onEdit?.(editData);
      } else {
        // Create mode
        const req: CalendarCreateRequest = {
          title,
          date,
          place: place.trim() || '',
          color,
          isAllDay,
          ...(isAllDay
            ? {}
            : {
                startTime: convertToISOFormat(startTime),
                endTime: convertToISOFormat(endTime),
              }),
        };

        // 먼저 모달 닫고
        onClose();

        // 그 다음 parent에 저장 요청
        onSave?.(req);
      }
    } catch (e) {
      alert('일정 저장에 실패했습니다.');
      console.error('일정 저장 실패:', e);
    }
  };

  //삭제 처리
  const handleDelete = async () => {
    if (!initialData?.calendarId) {
      console.log('initialData.calendarId가 없습니다');
      return;
    }
    try {
      // 먼저 모달 닫기 (UI 반응성 향상)
      onClose();

      // 서버 API 호출
      await deleteCalendarService(Number(initialData.calendarId));

      // 부모 컴포넌트의 onDelete 함수 호출
      onDelete?.(Number(initialData.calendarId));
    } catch (e) {
      alert('일정 삭제에 실패했습니다.');
      console.error('일정 삭제 실패:', e);
    }
  };

  // 모달 타이틀
  const modalTitle = isCreate
    ? '새 일정 추가'
    : isView
      ? '일정 보기'
      : '일정 수정';

  function toDisplayTime(timeStr: string) {
    if (!timeStr) return '오전 09:00';
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      let hour = date.getHours();
      const minute = date.getMinutes();
      const period = hour < 12 ? '오전' : '오후';
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
      return `${period} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    return timeStr;
  }

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
                maxLength={30}
              />
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-2 relative">
              <div className="col-span-2 flex items-center mb-2">
                <input
                  type="checkbox"
                  id="allDayCheckbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="mr-2"
                  disabled={!isEditable}
                />
                <label
                  htmlFor="allDayCheckbox"
                  className="text-xs sm:text-sm font-medium text-gray-700 select-none cursor-pointer"
                >
                  하루 종일
                </label>
              </div>
              <div className="col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      시작 시간
                    </label>
                    <div
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex items-center ${
                        isEditable
                          ? 'border-gray-300 cursor-pointer hover:border-primary'
                          : 'bg-gray-50 border-gray-200'
                      } ${isAllDay ? 'bg-gray-100 pointer-events-none opacity-60' : ''}`}
                      onClick={
                        isEditable && !isAllDay
                          ? () => setActiveTimePicker('start')
                          : undefined
                      }
                    >
                      <span className="mr-1 text-sm">⏰</span>
                      <span className="text-sm">
                        {toDisplayTime(startTime)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      종료 시간
                    </label>
                    <div
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex items-center ${
                        isEditable
                          ? 'border-gray-300 cursor-pointer hover:border-primary'
                          : 'bg-gray-50 border-gray-200'
                      } ${isAllDay ? 'bg-gray-100 pointer-events-none opacity-60' : ''}`}
                      onClick={
                        isEditable && !isAllDay
                          ? () => setActiveTimePicker('end')
                          : undefined
                      }
                    >
                      <span className="mr-1 text-sm">⏰</span>
                      <span className="text-sm">{toDisplayTime(endTime)}</span>
                    </div>
                  </div>
                  {isEditable && activeTimePicker && !isAllDay && (
                    <div className="absolute left-0 top-full w-full z-20 time-picker-container">
                      <TimePicker
                        value={toDisplayTime(
                          activeTimePicker === 'start' ? startTime : endTime
                        )}
                        onChange={(v: string) => {
                          if (activeTimePicker === 'start') setStartTime(v);
                          else setEndTime(v);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
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
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${colorOptions.find((c) => c.value === color)?.bg || 'bg-blue-500'} mr-2`}
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
                장소{' '}
                <span className="text-gray-400 text-xs font-normal">
                  (선택)
                </span>
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
                    placeholder="장소를 직접 입력하세요 (선택사항)"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    maxLength={255}
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
                      placeholder="장소를 입력하세요 (선택사항)"
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
                      maxLength={255}
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
                disabled={
                  isSaveDisabled ||
                  currentScheduleCount >= MAX_SCHEDULES_PER_DAY
                }
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
                  onClick={() => {
                    // view 모드에서 edit 모드로 전환
                    const newMode = 'edit' as const;
                    // 컴포넌트를 다시 렌더링하기 위해 모드를 직접 변경할 수 없으므로
                    // TodayShiftModal에서 모드를 변경하도록 변경된 모드와 현재 데이터를 함께 전달
                    onEdit?.({
                      mode: newMode,
                      title: title,
                      startTime: startTime,
                      endTime: endTime,
                      color: color,
                      place: place,
                      isAllDay: isAllDay,
                      date: date,
                      calendarId: initialData?.calendarId,
                    });
                  }}
                >
                  수정
                </button>
                <button
                  className="w-full py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-sm sm:text-base shadow-sm hover:bg-gray-100 transition-colors"
                  onClick={handleDelete}
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
                  onClick={handleDelete}
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
