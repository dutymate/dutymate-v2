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
          {[...recommendedDates]
            .sort((a, b) => {
              const order = { BEST: 0, OKAY: 1, HARD: 2 };
              return (
                order[
                  (a.message?.lunch || 'HARD') as 'BEST' | 'OKAY' | 'HARD'
                ] -
                order[(b.message?.lunch || 'HARD') as 'BEST' | 'OKAY' | 'HARD']
              );
            })
            .map((item) => {
              // 날짜 파싱
              const [year, month, day] = item.date.split('-').map(Number);
              const dayOfWeek = getDayOfWeekKo(year, month, day);
              const formattedDate = `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;

              const lunchValue = (item.message?.lunch || 'HARD') as
                | 'BEST'
                | 'OKAY'
                | 'HARD';
              const dinnerValue = (item.message?.dinner || 'HARD') as
                | 'BEST'
                | 'OKAY'
                | 'HARD';

              return (
                <div
                  key={item.date}
                  className={`${isMobile ? 'p-3' : 'p-2'} bg-gray-100 rounded-lg mb-1`}
                >
                  <div
                    className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'} font-bold ${isMobile ? 'mb-1' : 'mb-2'}`}
                  >
                    <span>{formattedDate}</span>
                    <span className="text-xs">
                      {(() => {
                        const priority = { BEST: 0, OKAY: 1, HARD: 2 };
                        if (lunchValue === dinnerValue) {
                          if (lunchValue === 'BEST') {
                            return (
                              <span style={{ color: '#F37C4C' }}>
                                점심과 저녁 모두 추천해요
                              </span>
                            );
                          } else if (lunchValue === 'OKAY') {
                            return (
                              <span style={{ color: '#F5A281' }}>
                                점심과 저녁 모두 가능해요
                              </span>
                            );
                          } else {
                            return (
                              <span style={{ color: '#F8CFC0' }}>
                                점심과 저녁 모두 어려워요
                              </span>
                            );
                          }
                        }
                        // 더 우선순위가 높은 쪽을 선택
                        let bestType = '';
                        let bestValue = '';
                        if (priority[lunchValue] < priority[dinnerValue]) {
                          bestType = 'lunch';
                          bestValue = lunchValue;
                        } else {
                          bestType = 'dinner';
                          bestValue = dinnerValue;
                        }
                        if (bestValue === 'BEST') {
                          return bestType === 'lunch' ? (
                            <span style={{ color: '#F37C4C' }}>
                              점심을 추천해요
                            </span>
                          ) : (
                            <span style={{ color: '#F37C4C' }}>
                              저녁을 추천해요
                            </span>
                          );
                        } else if (bestValue === 'OKAY') {
                          return bestType === 'lunch' ? (
                            <span style={{ color: '#F5A281' }}>
                              점심이 가능해요
                            </span>
                          ) : (
                            <span style={{ color: '#F5A281' }}>
                              저녁이 가능해요
                            </span>
                          );
                        } else {
                          return bestType === 'lunch' ? (
                            <span style={{ color: '#F8CFC0' }}>
                              점심은 잡기 어려워요
                            </span>
                          ) : (
                            <span style={{ color: '#F8CFC0' }}>
                              저녁은 잡기 어려워요
                            </span>
                          );
                        }
                      })()}
                    </span>
                  </div>
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
          className="mt-4 w-full bg-[#fff4ee] text-[#f47056] border-[0.5px] border-[#f47056] hover:bg-primary py-2 rounded-lg font-bold"
          onClick={handleCalendarView}
        >
          캘린더에서 날짜 확인하기
        </button>
        <button
          className="mt-4 w-full bg-primary text-white hover:bg-primary-dark py-2 rounded-lg font-bold"
          onClick={handleDownloadImage}
        >
          사진으로 저장하기
        </button>
        <ShareDateModal open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </div>
  );
};

export default DateSuggestionModal;
