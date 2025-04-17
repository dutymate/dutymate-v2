import { IoMdClose } from "react-icons/io";

interface NurseCountModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	neededNurseCount: number;
}

const NurseCountModal = ({
	isOpen,
	onClose,
	onConfirm,
	neededNurseCount,
}: NurseCountModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
			<div className="bg-white rounded-[1.25rem] p-[1.5rem] w-[90%] max-w-[25rem] relative">
				<button
					onClick={onClose}
					className="absolute right-[1.5rem] top-[1.5rem] text-gray-600 hover:text-gray-800"
				>
					<IoMdClose size={24} />
				</button>

				<h2 className="text-[1.25rem] font-bold mb-[1rem] text-center">
					간호사 추가 필요
				</h2>

				<p className="text-center mb-[2rem] text-gray-700">
					현재 근무 규칙을 위해선
					<br />
					<span className="text-primary text-lg font-bold">
						최소 {neededNurseCount}명
					</span>
					의 간호사가 필요합니다.
					<br />
					임시 간호사를 추가하시겠습니까?
				</p>

				<div className="flex gap-[0.5rem] justify-center">
					<button
						onClick={onClose}
						className="px-[1.5rem] py-[0.625rem] bg-gray-200 hover:bg-gray-300 rounded-[0.625rem] transition-colors"
					>
						취소
					</button>
					<button
						onClick={onConfirm}
						className="px-[1.5rem] py-[0.625rem] bg-primary hover:bg-primary-dark text-white rounded-[0.625rem] transition-colors"
					>
						추가하기
					</button>
				</div>
			</div>
		</div>
	);
};

export default NurseCountModal;
