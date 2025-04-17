// ReqShiftModal.tsx

import { useState, useEffect } from "react";
import { Button } from "../atoms/Button";
import { DateInput, TextArea } from "../atoms/Input";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import ToggleButton from "../atoms/ToggleButton";
import { requestService } from "../../services/requestService";
import { toast } from "react-toastify";

interface ReqShiftModalProps {
	onClose: () => void;
}

interface MyRequest {
	date: string;
	shift: "D" | "E" | "N" | "O";
	status: string;
	memo: string;
}

const ReqShiftModal = ({ onClose }: ReqShiftModalProps) => {
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedDuty, setSelectedDuty] = useState<
		"D" | "E" | "N" | "O" | null
	>(null);
	const [memo, setMemo] = useState("");
	const [activeTab, setActiveTab] = useState(0);
	const [requests, setRequests] = useState<MyRequest[]>([]);

	// 요청 내역 조회
	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const data = await requestService.getMyRequests();
				setRequests(data);
			} catch (error) {
				console.error("Failed to fetch requests:", error);
			}
		};
		fetchRequests();
	}, []);

	// 근무 요청 제출
	const handleSubmit = async () => {
		if (!selectedDate || !selectedDuty) return;

		try {
			await requestService.createRequest({
				date: selectedDate,
				shift: selectedDuty,
				memo: memo,
			});

			// 요청 성공 후 요청 내역 다시 조회
			const updatedRequests = await requestService.getMyRequests();
			setRequests(updatedRequests);

			// 입력 필드 초기화
			setSelectedDate("");
			setSelectedDuty(null);
			setMemo("");

			// 요청 내역 탭으로 전환
			setActiveTab(1);
		} catch (error: any) {
			toast.error(error.response.data.message);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACCEPTED":
				return "text-duty-day font-bold";
			case "HOLD":
				return "text-duty-night font-bold";
			case "DENIED":
				return "text-duty-evening font-bold";
			default:
				return "text-gray-700";
		}
	};

	// 상태 표시 텍스트 변환 함수 추가
	const getStatusText = (status: string) => {
		switch (status) {
			case "ACCEPTED":
				return "승인";
			case "HOLD":
				return "승인 대기중";
			case "DENIED":
				return "거절";
			default:
				return status;
		}
	};

	return (
		<div className="bg-white rounded-xl p-6 w-[23rem]">
			<div className="flex justify-between items-center mb-6">
				<ToggleButton
					options={[{ text: "근무 요청하기" }, { text: "요청 내역 확인하기" }]}
					selectedIndex={activeTab}
					variant="request"
					onChange={setActiveTab}
				/>
			</div>

			{activeTab === 0 ? (
				<div className="space-y-4">
					{/* 근무 날짜 */}
					<div>
						<div className="flex items-center gap-2 mb-1">
							<label className="text-sm font-medium text-gray-700">
								근무 날짜
							</label>
							<span className="text-xs text-gray-400">
								요청 보낼 날짜를 선택해주세요.
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
							{(["D", "E", "N", "O"] as const).map((duty) => (
								<DutyBadgeEng
									key={duty}
									type={duty}
									variant={selectedDuty === duty ? "filled" : "outline"}
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
							disabled={!selectedDate || !selectedDuty}
							className="min-w-[6.25rem] min-h-[2.5rem]"
						>
							요청하기
						</Button>
						<Button
							color="off"
							onClick={onClose}
							className="border   bg-white text-gray-900 min-w-[6.25rem] min-h-[2.5rem]"
						>
							닫기
						</Button>
					</div>
				</div>
			) : (
				<div>
					<div className="overflow-y-auto custom-scrollbar max-h-[20rem] pr-2">
						{requests.map((request, index) => (
							<div key={index} className="border-b border-gray-100 pb-4 mb-4">
								<div className="flex items-center gap-4">
									<DutyBadgeEng
										type={request.shift}
										variant="outline"
										size="md"
									/>
									<div className="flex-1">
										<div className="flex justify-between items-center mb-2">
											<span className="text-sm font-medium">
												{request.date}
											</span>
											<span
												className={`text-sm ${getStatusColor(request.status)}`}
											>
												{getStatusText(request.status)}
											</span>
										</div>
										<span className="text-sm text-gray-600">
											{request.memo}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="flex justify-center pt-4 border-t border-gray-100">
						<Button
							color="off"
							onClick={onClose}
							className="border border-gray-900 bg-white text-gray-900 min-w-[6.25rem] min-h-[2.5rem]"
						>
							닫기
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReqShiftModal;
