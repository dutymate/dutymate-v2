import React, { useState } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';
import ShareDateModal from './ShareDateModal';

interface DateSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onShareClick?: () => void;
}

interface RecommendedDate {
  date: string;
  comment?: string;
  members: { memberId: number; name: string }[];
  color: string;
  highlightColor?: string;
}

const recommendedDates: RecommendedDate[] = [
  {
    date: '2025-05-25(일)',
    comment: '모두 OFF 입니다~!',
    members: [
      { memberId: 1, name: '임태호' },
      { memberId: 2, name: '김현진' },
      { memberId: 3, name: '이재현' },
      { memberId: 4, name: '한종우' },
    ],
    color: 'bg-gray-100 text-gray-700',
  },
  {
    date: '2025-05-06(화)',
    members: [
      { memberId: 1, name: '임태호' },
      { memberId: 2, name: '김현진' },
      { memberId: 3, name: '이재현' },
      { memberId: 4, name: '한종우' },
    ],
    color: 'bg-gray-100 text-gray-700',
    highlightColor: 'bg-green-100 text-green-700',
  },
  {
    date: '2025-05-17(토)',
    members: [
      { memberId: 1, name: '임태호' },
      { memberId: 2, name: '김현진' },
      { memberId: 3, name: '이재현' },
      { memberId: 4, name: '한종우' },
    ],
    color: 'bg-purple-100 text-purple-700',
  },
];

const DateSuggestionModal: React.FC<DateSuggestionModalProps> = ({
  open,
  onClose,
  onShareClick,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [shareOpen, setShareOpen] = useState(false);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${isMobile ? 'max-w-full pb-4 pt-2 px-4 animate-slideup' : 'max-w-md p-5'}
          flex flex-col
          z-10
        `}
        style={isMobile ? { bottom: 0 } : {}}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <div className="text-lg font-semibold mb-4">추천 날짜 리스트</div>
        <div className="space-y-5 mb-6">
          {recommendedDates.map((item) => (
            <div key={item.date}>
              <div className="text-base font-bold mb-1">{item.date}</div>
              {item.comment && (
                <div className="text-sm text-gray-500 mb-2">{item.comment}</div>
              )}
              <div className="flex flex-wrap gap-2">
                {item.members.map((m) => (
                  <span
                    key={m.memberId}
                    className={`px-3 py-1.5 rounded-xl border font-semibold text-sm ${item.color}`}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-full bg-gray-700 text-white text-base font-bold py-2 rounded-xl shadow mt-2 active:bg-gray-800 transition"
          onClick={() => {
            setShareOpen(true);
            if (onShareClick) onShareClick();
          }}
        >
          공유하기
        </button>
        <ShareDateModal open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </div>
  );
};

export default DateSuggestionModal;
