import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { TempNurseButton } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import {
  HistoryModal,
  NurseAssignModal,
} from '@/components/organisms/WardAdminModal';
import WardAdminTemp from '@/components/organisms/WardAdminTemp';

import {
  wardService,
  WaitingNurseInfo,
  WardInfo,
} from '@/services/wardService';
import useUserAuthStore from '@/stores/userAuthStore';
import { MAX_TOTAL_NURSES, MAX_TEMP_NURSES } from '@/pages/WardAdmin';

interface WardAdminInfoProps {
  wardInfo: WardInfo;
  onAddTempNurse: (count: number) => void;
  onViewHistory: () => void;
}

const WardAdminInfo = ({ wardInfo, onAddTempNurse }: WardAdminInfoProps) => {
  const navigate = useNavigate();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<{
    name: string;
    gender: string;
    grade: number;
    memberId: number;
  } | null>(null);
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(wardInfo.wardCode);
    toast.success('병동 코드가 복사되었습니다');
  };

  const handleOpenNurseWaitModal = () => {
    setIsHistoryModalOpen(true);
  };

  const [nurses, setNurses] = useState<WaitingNurseInfo[]>([]);
  const [waitingCount, setWaitingfCount] = useState(0);

  // const wardStore = useWardStore();

  // 입장 대기 간호사 목록 조회
  const fetchNurses = async () => {
    try {
      const data = await wardService.getNurseWaitList();
      setNurses(data);
      setWaitingfCount(data.length);
    } catch (error) {
      console.error(error);
      toast.error('간호사 대기 목록을 조회하는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchNurses();
  }, [wardInfo.nurses]);

  const handleTempNurseAdd = (count: number) => {
    // 여기에 임시 간호사 추가 로직 구현

    onAddTempNurse(count);
    setIsTempModalOpen(false);
  };

  const handleGoToAutoGenerate = () => {
    const today = new Date();
    navigate(
      `/shift-admin?year=${today.getFullYear()}&month=${today.getMonth() + 1}`
    );
  };

  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  const handleOpenTempModal = () => {
    const currentTempNurses =
      wardInfo.nurses?.filter((nurse) => !nurse.isSynced)?.length || 0;
    const totalNurses = wardInfo.nursesTotalCnt;

    if (totalNurses >= MAX_TOTAL_NURSES) {
      toast.warning(
        `병동 최대 인원(${MAX_TOTAL_NURSES}명)을 초과할 수 없습니다.`
      );
      return;
    }

    if (currentTempNurses >= MAX_TEMP_NURSES) {
      toast.warning(
        `임시 간호사는 최대 ${MAX_TEMP_NURSES}명까지만 추가할 수 있습니다.`
      );
      return;
    }

    setIsTempModalOpen(true);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[1.15rem] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-2.5 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[0.95rem] text-gray-600 font-medium">
                병동 정보
              </h3>
              <button
                onClick={handleGoToAutoGenerate}
                className="flex items-center justify-center gap-1 py-1 px-3 bg-primary hover:bg-primary-dark rounded-lg transition-colors"
              >
                <Icon name="auto" size={14} className="text-white" />
                <span className="text-[0.8rem] text-white">
                  근무표 생성하기
                </span>
              </button>
            </div>
            <p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
              {wardInfo.hospitalName} | {wardInfo.wardName}
            </p>
          </div>

          <div className="bg-white rounded-xl p-2.5 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[0.95rem] text-gray-600 font-medium">
                병동 인원
              </h3>
              <TempNurseButton onClick={handleOpenTempModal} isDemo={isDemo} />
            </div>
            <p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
              {wardInfo.nursesTotalCnt}명
            </p>
          </div>

          <div className="bg-white rounded-xl p-2.5 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[0.95rem] text-gray-600 font-medium">
                병동 코드
              </h3>
              <button
                onClick={handleCopyCode}
                disabled={isDemo}
                className={`flex items-center justify-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                  isDemo
                    ? 'bg-gray-300 cursor-not-allowed opacity-60'
                    : 'bg-[#999786] hover:bg-[#88866f]'
                }`}
              >
                <Icon name="copy" size={14} className="text-white" />
                <span className="text-[0.8rem] text-white">복사하기</span>
              </button>
            </div>
            <p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
              {isDemo ? '로그인 후 이용 가능합니다.' : wardInfo.wardCode}
            </p>
          </div>

          <div className="bg-white rounded-xl p-2.5 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[0.95rem] text-gray-600 font-medium">
                입장 신청
              </h3>
              <button
                onClick={handleOpenNurseWaitModal}
                disabled={isDemo}
                className={`flex items-center justify-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                  isDemo
                    ? 'bg-gray-300 cursor-not-allowed opacity-60'
                    : 'bg-[#999786] hover:bg-[#88866f]'
                }`}
              >
                <Icon name="history" size={14} className="text-white" />
                <span className="text-[0.8rem] text-white">내역 조회</span>
              </button>
            </div>
            <p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
              {isDemo ? '로그인 후 이용 가능합니다.' : `${waitingCount}명 대기`}
            </p>
          </div>
        </div>
      </div>

      {/* <div className="mb-3">
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-0">
					<h2 className="text-lg font-semibold">간호사 관리</h2>
					<div className="flex items-center gap-2 w-full lg:w-auto">
						<div className="flex-1 lg:flex-initial">
							<SmallSearchInput
								id="search-nurse"
								name="searchNurse"
								placeholder="이름으로 검색하기"
							/>
						</div>
						<div className="flex gap-2 flex-shrink-0">
							<SortButton label="정렬" onClick={() => {}} />
							<FilterButton label="필터" onClick={() => {}} />
						</div>
					</div>
				</div>
			</div> */}

      {/* 모달 컴포넌트 */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectNurse={(nurse) => {
          setSelectedNurse(nurse);
          setIsHistoryModalOpen(false);
        }}
        nurses={nurses}
        fetchNurses={fetchNurses}
      />

      {selectedNurse && (
        <NurseAssignModal
          nurse={selectedNurse}
          onClose={() => {
            setSelectedNurse(null);
            fetchNurses();
          }}
          fetchNurses={fetchNurses}
        />
      )}

      <WardAdminTemp
        isOpen={isTempModalOpen}
        onClose={() => setIsTempModalOpen(false)}
        onConfirm={handleTempNurseAdd}
        currentNurseCount={wardInfo.nursesTotalCnt}
        currentTempNurses={
          wardInfo.nurses?.filter((nurse) => !nurse.isSynced)?.length || 0
        }
      />
    </div>
  );
};

export default WardAdminInfo;
