import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/atoms/Button';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import { DateInput, TextArea } from '@/components/atoms/Input';
import { requestService } from '@/services/requestService';
import { wardService, Nurse } from '@/services/wardService';

interface AdminReqShiftModalProps {
  onClose: () => void;
  onRequestCreated?: () => void;
}

const AdminReqShiftModal = ({
  onClose,
  onRequestCreated,
}: AdminReqShiftModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuty, setSelectedDuty] = useState<
    'D' | 'E' | 'N' | 'O' | null
  >(null);
  const [memo, setMemo] = useState('');
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);

  // 간호사 목록 조회
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const wardInfo = await wardService.getWardInfo();
        setNurses(wardInfo.nurses);
      } catch (error) {
        console.error('Failed to fetch nurses:', error);
        toast.error('간호사 목록을 불러오는데 실패했습니다.');
      }
    };
    fetchNurses();
  }, []);

  // 근무 요청 제출
  const handleSubmit = async () => {
    if (!selectedDate || !selectedDuty || !selectedNurseId) return;

    try {
      await requestService.createRequestByAdmin({
        memberId: selectedNurseId,
        date: selectedDate,
        shift: selectedDuty,
        memo: memo,
      });

      // 입력 필드 초기화
      setSelectedDate('');
      setSelectedDuty(null);
      setMemo('');
      setSelectedNurseId(null);
      toast.success('근무 요청이 등록되었습니다.');

      // 요청 목록 새로고침
      if (onRequestCreated) {
        onRequestCreated();
      }

      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || '근무 요청 등록에 실패했습니다.'
      );
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 w-[23rem]">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg font-bold">근무 요청 등록</h2>
        <p className="text-sm text-gray-500">
          간호사를 대신하여 근무 요청을 등록할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4">
        {/* 간호사 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            간호사 선택
          </label>
          <select
            value={selectedNurseId || ''}
            onChange={(e) => setSelectedNurseId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">간호사를 선택해주세요</option>
            {nurses.map((nurse) => (
              <option key={nurse.memberId} value={nurse.memberId}>
                {nurse.name}
              </option>
            ))}
          </select>
        </div>

        {/* 근무 날짜 */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700">
              근무 날짜
            </label>
            <span className="text-xs text-gray-400">
              요청할 날짜를 선택해주세요.
            </span>
          </div>
          <DateInput
            id="req-date"
            name="reqDate"
            label=""
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* 근무 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            근무 유형
          </label>
          <div className="flex gap-2">
            {(['D', 'E', 'N', 'O'] as const).map((duty) => (
              <DutyBadgeEng
                key={duty}
                type={duty}
                variant={selectedDuty === duty ? 'filled' : 'outline'}
                size="md"
                onClick={() => setSelectedDuty(duty)}
              />
            ))}
          </div>
        </div>

        {/* 메모 */}
        <div>
          <TextArea
            id="req-memo"
            name="reqMemo"
            label="메모"
            placeholder="요청 사유를 입력해주세요."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="h-[6.25rem]"
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-center gap-2 pt-4">
          <Button
            color="primary"
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedDuty || !selectedNurseId}
            className="min-w-[6.25rem] min-h-[2.5rem]"
          >
            등록하기
          </Button>
          <Button
            color="off"
            onClick={onClose}
            className="min-w-[6.25rem] min-h-[2.5rem]"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminReqShiftModal;
