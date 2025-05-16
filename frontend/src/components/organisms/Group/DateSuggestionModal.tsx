import React, { useState } from 'react';
import { RecommendedDate } from '@/types/group';
import useMediaQuery from '@/hooks/useMediaQuery';
import ShareDateModal from './ShareDateModal';
import { getDayOfWeekKo } from '@/utils/dateUtils';
import { toPng } from 'html-to-image';

interface DateSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onShareClick: () => void;
  recommendedDates: RecommendedDate[];
  onHighlightDates?: (dates: string[]) => void;
}

const getBadgeBg = (duty: string) => {
  switch (duty) {
    case 'D':
      return 'bg-duty-day-bg text-duty-day';
    case 'E':
      return 'bg-duty-evening-bg text-duty-evening';
    case 'N':
      return 'bg-duty-night-bg text-duty-night';
    case 'O':
      return 'bg-duty-off-bg text-duty-off';
    case 'M':
      return 'bg-duty-mid-bg text-duty-mid';
    case 'X':
      return 'bg-transparent text-transparent border border-gray-200';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const DateSuggestionModal: React.FC<DateSuggestionModalProps> = ({
  open,
  onClose,
  recommendedDates,
  onHighlightDates,
}) => {
  if (!open) return null;

  // 모두 OFF인지 확인
  const isAllOff = (memberList: { duty: string }[]) =>
    memberList.every((m) => m.duty === 'O');

  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [shareOpen, setShareOpen] = useState(false);

  const handleDownloadImage = async () => {
    const captureTarget = document.getElementById('date-suggestion-list');
    if (!captureTarget) return;

    // ShiftAdminTable 방식과 동일하게 구현
    // 현재 선택된 요소 상태 저장
    const tempSelectedElement = document.activeElement;
    if (tempSelectedElement instanceof HTMLElement) {
      tempSelectedElement.blur();
    }

    try {
      // 원본 요소에 직접 이미지 생성
      const dataUrl = await toPng(captureTarget, {
        quality: 1.0,
        pixelRatio: 2,
        width: captureTarget.scrollWidth + 40,
        height: captureTarget.scrollHeight + 40,
        backgroundColor: '#FFFFFF',
        style: {
          padding: '20px',
          borderRadius: '16px',
          maxHeight: 'none',
          overflow: 'visible',
        },
      });

      // 다운로드 트리거
      const link = document.createElement('a');
      link.download = '추천날짜리스트.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 저장 실패:', error);
    }
  };

  const handleCalendarView = () => {
    if (onHighlightDates) {
      onHighlightDates(recommendedDates.map((date) => date.date));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        id="date-suggestion-capture"
        className={`
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${
            isMobile
              ? 'max-w-full pb-4 pt-2 px-4 animate-slideup'
              : 'max-w-md p-5'
          }
          flex flex-col
          z-10
          max-h-[80vh]
        `}
        style={isMobile ? { bottom: 0 } : {}}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <div
          className={`text-lg font-semibold text-center ${isMobile ? 'my-1' : 'mt-0 mb-2'}`}
        >
          추천 날짜 리스트
        </div>
        <div
          id="date-suggestion-list"
          className={`space-y-2 ${isMobile ? 'mb-2' : 'mb-4'} overflow-y-auto max-h-[48vh] rounded-lg`}
        >
          {recommendedDates.map((item) => {
            // 날짜 파싱
            const [year, month, day] = item.date.split('-').map(Number);
            const dayOfWeek = getDayOfWeekKo(year, month, day);
            const formattedDate = `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;

            return (
              <div
                key={item.date}
                className={`${isMobile ? 'p-3' : 'p-2'} bg-gray-100 rounded-lg mb-1`}
              >
                <div
                  className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${isMobile ? 'mb-1' : 'mb-2'}`}
                >
                  {formattedDate}
                </div>
                {isAllOff(item.memberList) && (
                  <div className="text-sm text-gray-500 mb-2">
                    모두 OFF 입니다~!
                  </div>
                )}
                <div className="flex flex-wrap gap-1 max-h-[3.5rem] overflow-hidden">
                  {[...item.memberList]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((m) => (
                      <span
                        key={m.name}
                        className={`px-2 py-0.5 rounded border border-base-muted font-semibold text-xs ${getBadgeBg(m.duty)}`}
                        style={{ minWidth: 'fit-content' }}
                      >
                        <span className="text-base-foreground mr-0.5">
                          {m.name}
                        </span>{' '}
                        <span className="text-xs">{m.duty}</span>
                      </span>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
        <button
          className="w-full bg-primary text-white text-base font-bold py-2 rounded-lg shadow my-2 active:bg-primary-dark transition"
          onClick={handleCalendarView}
        >
          캘린더에서 날짜 확인하기
        </button>
        <button
          className="w-full bg-primary text-white text-base font-bold py-2 rounded-lg shadow my-2 active:bg-primary-dark transition"
          onClick={handleDownloadImage}
        >
          사진으로 저장하기
        </button>
        {/* 카카오 공유 기능 추후 추가 예정 */}
        {/* <button
          className="w-full bg-[#FEE500] text-[#3C1E1E] text-base font-bold py-2 rounded-lg shadow transition flex items-center justify-center gap-2"
          // onClick={handleKakaoShare}
        >
          <img
            src="/images/kakao_logo.png"
            alt="카카오 아이콘"
            className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem]"
          />
          <span>카카오톡으로 공유하기</span>
        </button> */}
        <ShareDateModal open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </div>
  );
};

export default DateSuggestionModal;
