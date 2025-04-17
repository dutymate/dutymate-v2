import useShiftStore from "../../store/shiftStore";
import { Icon } from "../atoms/Icon";

const RuleCheckList = () => {
	const issues = useShiftStore((state) => state.dutyInfo?.issues || []);

	return (
		<div className="flex flex-1 bg-white rounded-xl p-[1.25rem] shadow-lg relative overflow-hidden">
			{/* 헤더 아이콘 */}
			<div className="hidden lg:flex items-top justify-center pr-[1rem] sticky top-0 bg-white z-10">
				<Icon name="alert" size={24} className="text-gray-600" />
			</div>

			{/* 스크롤 영역 */}
			<div className="relative h-[18.75rem] flex-1 w-full min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
				{issues.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						규칙 위반이 없습니다.
					</div>
				) : (
					<div className="space-y-[0.75rem]">
						{issues.map((item, index) => (
							<div
								key={index}
								className="flex items-center gap-[0.7rem] px-[0.5rem]"
							>
								<span className="w-[4.3rem] bg-duty-off-bg px-[0.375rem] py-[0.1875rem] rounded-md">
									<span className="font-medium text-sm text-center truncate whitespace-nowrap block">
										{item.name}
									</span>
								</span>
								<span className="text-foreground text-xs lg:text-sm">
									{item.startDate}일
								</span>
								<div className="text-duty-evening-dark text-xs lg:text-sm text-red-500">
									{item.message}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default RuleCheckList;
