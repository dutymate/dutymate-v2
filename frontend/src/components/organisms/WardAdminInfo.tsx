import { Icon } from "../atoms/Icon";
// import { SmallSearchInput } from "../atoms/Input";
// import { SortButton, FilterButton } from "../atoms/SubButton";
import {
	WaitingNurseInfo,
	WardInfo,
	wardService,
} from "../../services/wardService";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
// import { ConnectButton } from "../atoms/Button";
// import { TempNurseButton } from "../atoms/Button";
import { HistoryModal, NurseAssignModal } from "./WardAdminModal";
import { TempNurseButton } from "../atoms/Button";
import WardAdminTemp from "./WardAdminTemp";
import { useNavigate } from "react-router-dom";

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
		toast.success("병동 코드가 복사되었습니다");
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
			toast.error("간호사 대기 목록을 조회하는데 실패했습니다.");
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
			`/shift-admin?year=${today.getFullYear()}&month=${today.getMonth() + 1}`,
		);
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
							<TempNurseButton onClick={() => setIsTempModalOpen(true)} />
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
								className="flex items-center justify-center gap-1 py-1 px-3 bg-[#999786] hover:bg-[#88866f] rounded-lg transition-colors"
							>
								<Icon name="copy" size={14} className="text-white" />
								<span className="text-[0.8rem] text-white">복사하기</span>
							</button>
						</div>
						<p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
							{wardInfo.wardCode}
						</p>
					</div>

					<div className="bg-white rounded-xl p-2.5 shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
						<div className="flex items-center justify-between mb-1">
							<h3 className="text-[0.95rem] text-gray-600 font-medium">
								입장 신청
							</h3>
							<button
								onClick={handleOpenNurseWaitModal}
								className="flex items-center justify-center gap-1 py-1 px-3 bg-[#999786] hover:bg-[#88866f] rounded-lg transition-colors"
							>
								<Icon name="history" size={14} className="text-white" />
								<span className="text-[0.8rem] text-white">내역 조회</span>
							</button>
						</div>
						<p className="font-semibold border border-gray-300 rounded-[0.375rem] px-3 py-1 text-center">
							{waitingCount > 0 ? `${waitingCount}명 대기` : "0명 대기"}
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
			/>
		</div>
	);
};

export default WardAdminInfo;
