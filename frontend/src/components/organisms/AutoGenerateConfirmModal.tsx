import { Button } from "../atoms/Button";
import { WardRule } from "../../services/ruleService";

interface AutoGenerateConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	onModify: () => void;
	wardRules: WardRule | null;
}

const AutoGenerateConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	onModify,
	wardRules,
}: AutoGenerateConfirmModalProps) => {
	if (!isOpen || !wardRules) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="bg-white rounded-xl shadow-lg w-[22.5rem] max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* 헤더 */}
				<div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-[1rem] py-[0.25rem] border-b">
					<h2 className="text-sm font-medium text-primary-dark">
						병동 듀티 규칙 확인
					</h2>
					<button
						onClick={onClose}
						className="text-primary hover:text-primary/80"
					>
						<span className="text-lg">×</span>
					</button>
				</div>

				{/* 내용 */}
				<div className="p-[1rem]">
					<div className="space-y-[0.5rem]">
						{/* 안내 멘트 */}
						<div className="flex items-center justify-center gap-[0.25rem] py-[0.5rem] px-[0.25rem] bg-gray-50 rounded font-bold text-sm text-primary">
							<span>병동 듀티 규칙을 확인해주세요.</span>
						</div>

						{/* 평일 근무자 수 */}
						<div className="flex items-center justify-between py-[0.375rem] border-b">
							<span className="text-sm text-foreground">평일 근무자 수</span>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-day">D</span>
									<span className="text-sm">{wardRules.wdayDCnt}명</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-evening">
										E
									</span>
									<span className="text-sm">{wardRules.wdayECnt}명</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-night">N</span>
									<span className="text-sm">{wardRules.wdayNCnt}명</span>
								</div>
							</div>
						</div>

						{/* 주말 근무자 수 */}
						<div className="flex items-center justify-between py-[0.375rem] border-b">
							<span className="text-sm text-foreground">주말 근무자 수</span>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-day">D</span>
									<span className="text-sm">{wardRules.wendDCnt}명</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-evening">
										E
									</span>
									<span className="text-sm">{wardRules.wendECnt}명</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-duty-night">N</span>
									<span className="text-sm">{wardRules.wendNCnt}명</span>
								</div>
							</div>
						</div>

						{/* 전담 근무 설정 버튼 */}
						<div className="flex items-center justify-end py-0.5 border-b">
							<div className="relative group">
								<button
									onClick={() => (window.location.href = "/ward-admin")}
									className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
								>
									전담 근무 배정하기
								</button>
								<div className="absolute right-0 top-full mt-1 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
									평일 D 고정, N 킵 인원을 추가해보세요!
								</div>
							</div>
						</div>

						{/* 연속 근무 규칙 */}
						<div className="flex items-center justify-between py-[0.375rem] border-b">
							<span className="text-sm text-foreground">연속 근무 수 최대</span>
							<div className="flex items-center gap-1.5">
								<span className="text-sm">{wardRules.maxShift}일 이하</span>
							</div>
						</div>

						<div className="flex items-center justify-between py-[0.375rem] border-b">
							<span className="text-sm text-foreground">나이트 연속 최대</span>
							<div className="flex items-center gap-1.5">
								<span className="text-sm">{wardRules.maxN}일 이하</span>
							</div>
						</div>

						<div className="flex items-center justify-between py-[0.375rem] border-b">
							<span className="text-sm text-foreground">나이트 연속 최소</span>
							<div className="flex items-center gap-1.5">
								<span className="text-sm">{wardRules.minN}일 이상</span>
							</div>
						</div>
					</div>

					{/* 버튼 영역 */}
					<div className="flex justify-end gap-[0.25rem] mt-[0.75rem]">
						<Button size="xs" color="muted" onClick={onModify}>
							수정하기
						</Button>
						<Button size="xs" color="primary" onClick={onConfirm}>
							확인 완료
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AutoGenerateConfirmModal;
