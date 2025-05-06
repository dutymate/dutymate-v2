import { useEffect, useState, useRef, useCallback } from 'react';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import { MdClose, MdSwapHoriz, MdDragIndicator } from 'react-icons/md';

// 듀티 타입 정의
type DutyType = 'D' | 'E' | 'N' | 'M' | 'O' | 'X';

interface MobileDutyControlsProps {
  isVisible: boolean;
  onDutySelect: (dutyType: DutyType) => void;
  onClose: () => void;
}

const MobileDutyControls = ({
  isVisible,
  onDutySelect,
  onClose,
}: MobileDutyControlsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // 상태 관리
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 초기 위치 설정
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const containerWidth = containerRef.current.offsetWidth;

      // 화면 중앙 하단에 위치
      setPosition({
        x: (screenWidth - containerWidth) / 2,
        y: screenHeight * 0.8, // 화면 높이의 80% 지점
      });
    }
  }, [isVisible]);

  // 터치 이벤트 핸들러 설정
  useEffect(() => {
    const dragHandle = dragHandleRef.current;
    if (!dragHandle) return;

    const touchStartHandler = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);

      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    };

    dragHandle.addEventListener('touchstart', touchStartHandler, {
      passive: false,
    });

    return () => {
      dragHandle.removeEventListener('touchstart', touchStartHandler);
    };
  }, [position]);

  // 마우스 드래그 시작 핸들러
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 드래그 중 핸들러
  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

      setPosition({
        x: clientX - dragOffset.x,
        y: clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 드래그 이벤트 리스너 등록/제거
  useEffect(() => {
    if (!isDragging) return;

    const options = { passive: false };
    window.addEventListener('mousemove', handleDrag, options);
    window.addEventListener('touchmove', handleDrag, options);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    // 전체 문서의 스크롤 방지
    const preventTouch = (e: TouchEvent) => {
      if (isDragging) e.preventDefault();
    };
    document.addEventListener('touchmove', preventTouch, options);

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      document.removeEventListener('touchmove', preventTouch);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  // 진동 피드백
  const triggerVibration = useCallback(() => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  }, []);

  // 회전 전환 핸들러
  const toggleOrientation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHorizontal((prev) => !prev);
  }, []);

  // 버튼 클릭 핸들러
  const handleButtonClick = useCallback(
    (e: React.MouseEvent, dutyType: DutyType) => {
      e.stopPropagation();
      e.preventDefault();

      triggerVibration();

      // 애니메이션이 보이도록 약간 지연
      setTimeout(() => {
        onDutySelect(dutyType);
        onClose();
      }, 150);
    },
    [onDutySelect, onClose, triggerVibration]
  );

  if (!isVisible) return null;

  // 듀티 버튼 목록
  const dutyTypes: DutyType[] = ['D', 'E', 'N', 'M', 'O', 'X'];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      <div
        ref={containerRef}
        className="absolute pointer-events-auto bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100 transform transition-all duration-200 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: isDragging ? 'none' : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 컨트롤 버튼들 */}
        <button
          className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-md text-gray-500 hover:text-gray-700 z-10"
          onClick={onClose}
        >
          <MdClose className="w-5 h-5" />
        </button>

        <button
          className="absolute -right-3 -bottom-3 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-md text-gray-500 hover:text-gray-700 z-10"
          onClick={toggleOrientation}
        >
          <MdSwapHoriz
            className={`w-5 h-5 ${isHorizontal ? 'rotate-90' : 'rotate-0'}`}
          />
        </button>

        {/* 컨텐츠 컨테이너 */}
        <div
          className={`${isHorizontal ? 'flex items-center' : 'flex flex-col items-center'}`}
        >
          {/* 그랩 핸들 */}
          <div
            ref={dragHandleRef}
            className={`flex items-center justify-center cursor-grab active:cursor-grabbing 
              ${isHorizontal ? 'mr-1.5 -ml-1' : 'mb-1.5 -mt-1'}`}
            onMouseDown={handleDragStart}
          >
            <MdDragIndicator
              className={`w-7 h-7 text-gray-400 ${isHorizontal ? 'rotate-0' : 'rotate-90'}`}
            />
          </div>

          {/* 듀티 버튼들 */}
          <div
            className={`grid ${isHorizontal ? 'grid-cols-6' : 'grid-cols-1 grid-rows-6'} gap-3`}
          >
            {dutyTypes.map((type) => (
              <button
                key={type}
                className="flex justify-center active:scale-90 transition-transform duration-150 transform"
                onClick={(e) => handleButtonClick(e, type)}
              >
                <div className="scale-[1.2] duty-badge-eng">
                  <DutyBadgeEng type={type} size="md" variant="filled" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDutyControls;
