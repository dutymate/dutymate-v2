import React from 'react';

interface DateSuggestionModalProps {
  open: boolean;
  onClose: () => void;
}

const dummyData = [
  {
    date: '2025-05-25(일)',
    comment: '모두 OFF 입니다~!',
    members: [
      { name: '임태호' },
      { name: '김현진' },
      { name: '이재현' },
      { name: '한종우' },
    ],
    color: 'bg-gray-100 text-gray-700',
  },
  {
    date: '2025-05-06(화)',
    members: [
      { name: '임태호' },
      { name: '김현진' },
      { name: '이재현' },
      { name: '한종우' },
    ],
    color: 'bg-gray-100 text-gray-700',
    highlightColor: 'bg-green-100 text-green-700',
  },
  {
    date: '2025-05-17(토)',
    members: [
      { name: '임태호' },
      { name: '김현진' },
      { name: '이재현' },
      { name: '한종우' },
    ],
    color: 'bg-purple-100 text-purple-700',
  },
];

const DateSuggestionModal: React.FC<DateSuggestionModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 z-10 animate-slideup">
        <button
          className="absolute top-4 right-4 text-gray-400 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <div className="text-xl font-semibold mb-6">추천 날짜 리스트</div>
        <div className="space-y-7 mb-8">
          {dummyData.map((item) => (
            <div key={item.date}>
              <div className="text-lg font-bold mb-1">{item.date}</div>
              {item.comment && (
                <div className="text-sm text-gray-500 mb-2">{item.comment}</div>
              )}
              <div className="flex flex-wrap gap-2">
                {item.members.map((m) => (
                  <span
                    key={m.name}
                    className={`px-4 py-2 rounded-xl border font-semibold text-base ${item.color}`}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-full bg-gray-700 text-white text-lg font-bold py-3 rounded-xl shadow mt-2 active:bg-gray-800 transition"
          onClick={onClose}
        >
          공유하기
        </button>
      </div>
    </div>
  );
};

export default DateSuggestionModal;
