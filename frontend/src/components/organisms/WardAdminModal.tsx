import { Icon } from "../atoms/Icon";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ConnectButton } from "../atoms/Button";
import { WaitingNurseInfo, wardService } from "../../services/wardService";
import { IoMdClose } from "react-icons/io";

interface Nurse {
	name: string;
	gender: string;
	grade: number;
	memberId: number;
}

interface HistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectNurse: (nurse: Nurse) => void;
	nurses: WaitingNurseInfo[];
	fetchNurses: () => void;
}

interface NurseAssignModalProps {
	nurse: Nurse;
	onClose: () => void;
	fetchNurses: () => void;
}

// Add interface for temp nurse
interface TempNurse {
	tempMemberId: number;
	profileImg: string | null;
	name: string;
	grade: number;
	gender: "F" | "M";
}

// 내역 조회 모달
export const HistoryModal = ({
	isOpen,
	onClose,
	onSelectNurse,
	nurses,
	fetchNurses,
}: HistoryModalProps) => {
	if (!isOpen) return null;

	// 입장 대기 간호사 거절하기
	const handleDenyWaitingNurse = async (nurse: any) => {
		try {
			await wardService.deniedWaitingNurse(nurse.memberId);
			toast.info("거절되었습니다");

			await fetchNurses();
		} catch (error) {
			console.error(error);
			toast.error("입장 거절을 실패했습니다.");
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div className="bg-white rounded-2xl p-6 w-full max-w-[29rem] sm:max-w-[30rem] mx-4">
				<div className="flex justify-between items-center mb-4 relative">
					<h2 className="text-xl font-semibold text-center w-full">
						입장 신청 내역
					</h2>
					<button
						onClick={onClose}
						className="text-gray-600 hover:text-gray-800 absolute right-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<IoMdClose size={24} />
					</button>
				</div>

				<div className="bg-gray-50 rounded-xl p-4">
					<div className="flex flex-col items-center max-h-[20rem] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
						{nurses.length === 0 ? (
							<div className="flex items-center justify-center h-[6rem] text-gray-500">
								입장 대기 인원이 없습니다.
							</div>
						) : (
							nurses.map((nurse, i) => (
								<div
									key={i}
									className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white rounded-xl border border-gray-100 min-w-[18.5rem] sm:min-w-0 w-full max-w-[25rem]"
								>
									<div className="flex items-center sm:gap-4 gap-2">
										<div className="flex items-center gap-1 sm:gap-1.5 w-[4rem] sm:w-[5rem]">
											<span className="font-medium truncate text-[0.875rem]">
												{nurse.name}
											</span>
										</div>
										<div className="flex items-center gap-0.5 sm:gap-1 w-[2.2rem] sm:w-[2.8125rem]">
											<Icon
												name={nurse.gender === "F" ? "female" : "male"}
												size={14}
												className="text-gray-500 flex-shrink-0"
											/>
											<span className="text-gray-600 text-sm">
												{nurse.gender === "F" ? "여자" : "남자"}
											</span>
										</div>
										<div className="flex items-center gap-0.5 sm:gap-1 w-[2.2rem] sm:w-[2.8125rem]">
											<Icon
												name="idCard"
												size={0.875}
												className="text-gray-500 flex-shrink-0"
											/>
											<span className="text-gray-600 text-[0.875rem] whitespace-nowrap">
												{nurse.grade}년차
											</span>
										</div>
									</div>
									<div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto">
										<button
											onClick={() => onSelectNurse(nurse)}
											className="px-2 sm:px-3 py-1 rounded-[0.375rem] text-[0.75rem] transition-colors bg-primary text-white hover:bg-primary-dark whitespace-nowrap"
										>
											수락
										</button>
										<button
											onClick={() => handleDenyWaitingNurse(nurse)}
											className="px-2 sm:px-3 py-1 rounded-[0.375rem] text-[0.75rem] transition-colors bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
										>
											거절
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// 간호사 배정 모달
export const NurseAssignModal = ({
	nurse,
	onClose,
	fetchNurses,
}: NurseAssignModalProps) => {
	console.log("nurse :>> ", nurse);

	const [selectedNurse, setSelectedNurse] = useState<number | null>(null);
	const [tempNurses, setTempNurses] = useState<TempNurse[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchTempNurses = async () => {
			try {
				const data = await wardService.getTempNurseList();
				setTempNurses(data);
			} catch (error) {
				console.error("임시 간호사 목록 조회 실패:", error);
				toast.error("임시 간호사 목록을 불러오는데 실패했습니다");
			} finally {
				setIsLoading(false);
			}
		};

		fetchTempNurses();
	}, []);

	// 임시 간호사와 연동하기기
	const handleConnect = async (tempNurse: any) => {
		const confirm = window.confirm(
			`간호사 ${tempNurse.name}과(와) 연동을 진행하시겠습니까?`,
		);
		if (!confirm) return;

		try {
			await wardService.connectWithEnterMember(
				nurse.memberId,
				tempNurse.memberId,
			);

			// 성공적으로 연동된 경우, 임시 간호사 목록에서 제거
			setTempNurses((prev) =>
				prev.filter((n) => n.tempMemberId !== tempNurse.tempMemberId),
			);

			setSelectedNurse(tempNurse.tempMemberId);
			onClose();

			// 실제 간호사 목록을 다시 불러오기
			fetchNurses();
			window.location.reload();
		} catch (error) {
			console.error(error);
			toast.error("연동에 실패했습니다.");
		}
	};

	// 입장 대기 간호사 승인 후, 연동하지 않고 추가하기기
	const handleAddNurseWithoutSynced = async () => {
		const confirm = window.confirm(
			`임시간호사와 연동하지 않고 추가하시겠습니까?`,
		);
		if (!confirm) return;

		try {
			await wardService.addNurseWithoutConnect(nurse.memberId);

			onClose();

			// 실제 간호사 목록을 다시 불러오기
			fetchNurses();
			window.location.reload();
		} catch (error) {
			console.error(error);
			toast.error("간호사 추가에 실패했습니다.");
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div className="bg-white rounded-2xl p-6 w-full max-w-[29rem] sm:max-w-[30rem] mx-4">
				<div className="flex justify-between items-center mb-4 relative">
					<h2 className="text-xl font-semibold text-center w-full">
						간호사 배정
					</h2>
					<button
						onClick={onClose}
						className="text-gray-600 hover:text-gray-800 absolute right-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<IoMdClose size={24} />
					</button>
				</div>

				{/* 선택된 간호사 정보 */}
				<div className="flex items-center justify-center gap-4 px-3 py-2.5 bg-white rounded-xl mb-4 border border-primary-20 min-w-[18.5rem] sm:min-w-0 w-full max-w-[25rem]">
					<div className="flex items-center gap-1.5 w-[5rem]">
						<Icon
							name="user"
							size={1.125}
							className="text-gray-500 flex-shrink-0"
						/>
						<span className="font-medium truncate text-[0.875rem]">
							{nurse.name}
						</span>
					</div>
					<div className="flex items-center gap-1 w-[2.8125rem]">
						<Icon
							name={nurse.gender === "F" ? "female" : "male"}
							size={14}
							className="text-gray-500 flex-shrink-0"
						/>
						<span className="text-gray-600 text-sm">
							{nurse.gender === "F" ? "여자" : "남자"}
						</span>
					</div>
					<div className="flex items-center gap-1 w-[2.8125rem]">
						<Icon
							name="idCard"
							size={0.875}
							className="text-gray-500 flex-shrink-0"
						/>
						<span className="text-gray-600 text-[0.875rem] whitespace-nowrap">
							{nurse.grade}년차
						</span>
					</div>
				</div>

				<p className="text-sm text-gray-500 mb-3">
					연동할 간호사를 선택해주세요.
				</p>

				{/* 간호사 선택 리스트 */}
				<div className="bg-gray-50 rounded-xl p-4 mb-4">
					<div className="text-[0.875rem] text-gray-600 mb-2 px-2">근무자</div>
					<div className="max-h-[17.5rem] overflow-y-auto space-y-2 pr-2">
						{isLoading ? (
							<div className="text-center py-4">로딩 중...</div>
						) : tempNurses.length === 0 ? (
							<div className="text-center py-4">임시 간호사가 없습니다.</div>
						) : (
							tempNurses.map((tempNurse) => (
								<div
									key={tempNurse.tempMemberId}
									className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white rounded-xl min-w-[18.5rem] sm:min-w-0 w-full max-w-[25rem]"
								>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1.5 w-[80px]">
											<span className="font-medium truncate text-sm mx-2">
												{tempNurse.name}
											</span>
										</div>
										<div className="flex items-center gap-1 w-[45px]">
											<Icon
												name={tempNurse.gender === "F" ? "female" : "male"}
												size={14}
												className="text-gray-500 flex-shrink-0"
											/>
											<span className="text-gray-600 text-sm">
												{tempNurse.gender === "F" ? "여자" : "남자"}
											</span>
										</div>
										<div className="flex items-center gap-1 w-[45px]">
											<Icon
												name="idCard"
												size={14}
												className="text-gray-500 flex-shrink-0"
											/>
											<span className="text-gray-600 text-sm whitespace-nowrap">
												{tempNurse.grade}년차
											</span>
										</div>
									</div>
									<button
										onClick={() => handleConnect(tempNurse)}
										className={`px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
											selectedNurse === tempNurse.tempMemberId
												? "bg-primary text-white hover:bg-primary-dark"
												: "bg-white text-primary border border-primary hover:bg-primary hover:text-white"
										}`}
									>
										연동
									</button>
								</div>
							))
						)}
					</div>
				</div>

				{/* 하단 버튼 */}
				<div className="flex justify-center">
					<ConnectButton onClick={handleAddNurseWithoutSynced} />
				</div>
			</div>
		</div>
	);
};
