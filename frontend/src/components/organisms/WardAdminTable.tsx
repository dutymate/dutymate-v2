// import { useState } from "react";
import WardAdminRowCard from "./WardAdminRowCard";
// import { Nurse } from "../../services/wardService";
// import { wardService } from "../../services/wardService";

import { toast } from "react-toastify";
import useWardStore from "../../store/wardStore";
import { Icon } from "../atoms/Icon";
import DutyTooltip from "../atoms/DutyTooltip";

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
			toast.success("간호사 정보가 수정되었습니다", {
				position: "top-right",
			});
		} catch (error) {
			toast.error("간호사 정보 수정에 실패했습니다", {
				position: "top-right",
			});
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
									<div className="w-[9rem] pl-[5rem]">이름</div>
									<div className="w-[3.75rem] text-center">직위</div>
									<div className="w-[3.75rem] text-center">성별</div>
									<div className="w-[4.375rem] pl-[1.7rem]">경력</div>
									<div className="w-[5rem] pl-[2rem]">숙련도</div>
									<div className="w-[11rem] pl-[3rem] flex items-center gap-[0.25rem]">
										전담 근무
										<DutyTooltip message="자동생성 시 반영됩니다.">
											<div className="cursor-help relative z-20">
												<Icon
													name="alert"
													size={20}
													className="text-gray-400"
												/>
											</div>
										</DutyTooltip>
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
