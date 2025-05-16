import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button.tsx';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng.tsx';
import { wardService } from '@/services/wardService';
import { getHolidayDays } from '@/utils/dateUtils';

interface AddNurseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConnect: boolean;
  message: string;
  enterMemberId: number;
  tempMemberId: number;
}

const AddNurseConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isConnect,
  message,
  enterMemberId,
  tempMemberId,
}: AddNurseConfirmModalProps) => {
  const [enterShifts, setEnterShifts] = useState('');
  const [tempShifts, setTempShifts] = useState('');
  const [selected, setSelected] = useState<'enter' | 'temp' | null>(null);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<number[]>([]);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // zero-based
    const holidayList = getHolidayDays(year, month + 1);

    const weekendDays: number[] = [];
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sun or Sat
      if (isWeekend) weekendDays.push(day);
    }

    const allRedDays = Array.from(new Set([...holidayList, ...weekendDays]));
    setHolidays(allRedDays);
  }, []);

  useEffect(() => {
    if (isOpen && enterMemberId) {
      const fetchShifts = async () => {
        try {
          setLoading(true);
          const res = await wardService.getShiftComparison(
            enterMemberId,
            isConnect ? tempMemberId : null
          );
          setEnterShifts(res.enterMemberShifts);
          setTempShifts(res.tempMemberShifts);
        } catch (e) {
          console.error('근무표 비교 조회 실패', e);
        } finally {
          setLoading(false);
        }
      };
      fetchShifts();
    }
  }, [isOpen, enterMemberId, tempMemberId, isConnect]);

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      const appliedShifts = selected === 'enter' ? enterShifts : tempShifts;

      if (isConnect) {
        await wardService.connectWithEnterMember(
          enterMemberId,
          tempMemberId,
          appliedShifts
        );
      } else {
        await wardService.addNurseWithoutConnect(enterMemberId, appliedShifts);
      }

      onConfirm();
    } catch (e) {
      console.error('간호사 추가 실패', e);
    }
  };

  const renderShifts = (
    shifts: string,
    label: string,
    type: 'enter' | 'temp'
  ) => (
    <div className="flex flex-col gap-1">
      <span className="font-semibold text-sm ml-1">{label}</span>
      <div
        onClick={() => setSelected(type)}
        className={`border rounded-xl p-3 min-w-full overflow-x-auto flex flex-col gap-2 cursor-pointer ${
          selected === type
            ? 'border-primary ring-2 ring-primary'
            : 'border-gray-300'
        }`}
      >
        <div className="flex gap-1 justify-start">
          {shifts.split('').map((_, idx) => (
            <div
              key={idx}
              className="min-w-[24px] w-[24px] max-w-[24px] text-center text-[0.75rem] font-medium"
              style={{ color: holidays.includes(idx + 1) ? 'red' : undefined }}
            >
              {idx + 1}
            </div>
          ))}
        </div>
        <div className="flex gap-1 justify-start">
          {shifts.split('').map((duty, idx) => (
            <div
              key={idx}
              className="min-w-[24px] w-[24px] max-w-[24px] flex justify-center"
            >
              <DutyBadgeEng type={duty as any} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-[90%] max-w-[22.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-[0.9375rem] font-medium text-left mb-2">
            이번 달 반영할 근무표를 선택해주세요
          </h2>

          <p className="text-left mb-4 text-[0.9375rem]">{message}</p>

          {loading ? (
            <p className="text-sm text-center py-4">근무표 불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {renderShifts(enterShifts, '입장 간호사 근무표', 'enter')}
              {renderShifts(
                tempShifts,
                isConnect ? '현재 병동 근무표' : '비어 있는 근무표',
                'temp'
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="md"
              color="muted"
              onClick={onClose}
              className="flex-1 bg-[#F1F1F1] hover:bg-[#E5E5E5] active:bg-[#DADADA] text-black font-normal rounded-xl py-3 transition-colors"
            >
              취소
            </Button>
            <Button
              size="md"
              color="primary"
              onClick={handleSubmit}
              disabled={!selected}
              className="flex-1 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-normal rounded-xl py-3 transition-colors disabled:opacity-50"
            >
              {isConnect ? '연동하기' : '추가하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNurseConfirmModal;
