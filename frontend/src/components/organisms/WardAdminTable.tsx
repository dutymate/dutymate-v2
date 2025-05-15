import { toast } from 'react-toastify';
import WardAdminRowCard from '@/components/organisms/WardAdminRowCard';
import useWardStore from '@/stores/wardStore';
import { Tooltip } from '@/components/atoms/Tooltip';

interface WardAdminTableProps {
  // nurses: Nurse[];
}

const WardAdminTable = ({}: WardAdminTableProps) => {
  const { updateNurse, syncWithServer, getSortedNurses } = useWardStore();
  const sortedNurses = getSortedNurses();
  // const [setSelectedNurses] = useState<string[]>([]);
  // const [selectedNurses] = useState<string[]>([]);

  const handleNurseUpdate = async (memberId: number, data: any) => {
    try {
      await updateNurse(memberId, data);
      toast.success('간호사 정보가 수정되었습니다');
    } catch (error) {
      toast.error('간호사 정보 수정에 실패했습니다');
      // 실패 시 서버와 강제 동기화
      await syncWithServer();
    }
  };

  return (
    <div className="bg-white rounded-[1.154375rem] p-[1rem]">
      <div className="relative overflow-visible">
        <div className="overflow-x-auto">
          <div className="flex flex-col gap-[0.5rem] min-w-[56.25rem] min-h-[37.5rem]">
            {/* Header */}
            <div className="flex items-center p-[0.375rem] lg:p-[0.5rem] mb-[0.5rem] text-[0.875rem] lg:text-[1rem] text-gray-600 font-medium bg-base-muted-30 rounded-xl">
              <div className="flex items-center justify-between flex-1 gap-[2.5rem]">
                <div className="flex items-center gap-[1.5rem] flex-shrink-0">
                  <div className="w-[7rem] pl-[0.5rem]">이름</div>
                  <div className="w-[3.75rem] text-center">성별</div>
                  <div className="w-[4.375rem] pl-[1.7rem]">경력</div>
                  {/* <div className="w-[5rem] pl-[2rem]">숙련도</div> */}
                  <div className="w-[5rem] pl-[2rem]">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      업무강도
                      <Tooltip
                        content={
                          <div className="text-left">
                            <p>
                              업무강도는 자동 생성 시 OFF 일수에 반영됩니다.
                            </p>
                            <p className="mt-1">
                              • 높음: 평균보다 2~3일 적게 배정
                            </p>
                            <p>• 중간: 평균 일수로 배정</p>
                            <p>• 낮음: 평균보다 2~3일 많이 배정</p>
                          </div>
                        }
                        icon={{
                          name: 'alert',
                          size: 14,
                          className:
                            'text-gray-400 hover:text-gray-600 cursor-help',
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-[11rem] pl-[3rem] flex items-center gap-[0.25rem]">
                    전담 근무
                    <Tooltip
                      content={
                        <div className="text-left">
                          <p>전담 근무를 선택해 주세요.</p>
                          <p className="mt-1">
                            • MID: 다른 근무와 중복 배정 불가.
                          </p>
                        </div>
                      }
                      icon={{
                        name: 'alert',
                        size: 14,
                        className:
                          'text-gray-400 hover:text-gray-600 cursor-help',
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-[1.5rem] flex-1 min-w-0">
                  <div className="flex-1 text-center">메모</div>
                </div>
              </div>
            </div>
            {/* Nurse List */}
            {sortedNurses.map((nurse, index) => (
              <WardAdminRowCard
                key={`${nurse.memberId}-${nurse.name}-${index}`}
                nurse={nurse}
                onUpdate={handleNurseUpdate}
                useCustomDutyLabels={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardAdminTable;
