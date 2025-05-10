import { FaCrown } from 'react-icons/fa';
import useMediaQuery from '@/hooks/useMediaQuery';
import DateSuggestionModal from './DateSuggestionModal';
import ShareDateModal from './ShareDateModal';
import { useState } from 'react';

interface Member {
  name: string;
  isLeader?: boolean;
}

interface CheckMemberModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
  selectedMembers: string[];
  setSelectedMembers: (names: string[]) => void;
  onNext?: () => void;
}

const CheckMemberModal: React.FC<CheckMemberModalProps> = ({
  open,
  onClose,
  members,
  selectedMembers,
  setSelectedMembers,
  onNext,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [dateSuggestionOpen, setDateSuggestionOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!open) return null;

  const handleToggle = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter((n) => n !== name));
    } else {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${isMobile ? 'max-w-full pb-4 pt-2 px-4 animate-slideup' : 'max-w-sm p-5'}
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
        <div className="text-lg font-semibold mb-4">인원 선택하기</div>
        <div className="flex flex-wrap gap-2 mb-7 max-[1023px]:justify-center">
          {members.map((m) => (
            <button
              key={m.name}
              className={`
                flex items-center px-4 py-1.5 rounded-xl border text-sm font-semibold transition
                ${
                  selectedMembers.includes(m.name)
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-white border-gray-300 text-gray-500'
                }
              `}
              style={{ minWidth: 75 }}
              onClick={() => handleToggle(m.name)}
            >
              {m.isLeader && (
                <FaCrown className="mr-1 text-yellow-400 text-base" />
              )}
              {m.name}
            </button>
          ))}
        </div>
        <button
          className="w-full bg-gray-700 text-white text-base font-bold py-2 rounded-xl shadow mt-2 active:bg-gray-800 transition"
          onClick={() => {
            setDateSuggestionOpen(true);
            if (onNext) onNext();
          }}
        >
          약속 날짜 추천받기
        </button>
        <DateSuggestionModal
          open={dateSuggestionOpen}
          onClose={() => setDateSuggestionOpen(false)}
          onShareClick={() => setShareOpen(true)}
        />
        <ShareDateModal open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </div>
  );
};

export default CheckMemberModal;
