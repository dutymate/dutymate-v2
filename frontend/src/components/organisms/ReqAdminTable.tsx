// ReqAdminTable.tsx

import { useEffect, useState } from "react";
// import { SmallSearchInput } from "../atoms/Input";
// import { SortButton, FilterButton } from "../atoms/SubButton";
import { useLoadingStore } from "@/store/loadingStore";
import { toast } from "react-toastify";
import { requestService, WardRequest } from "../../services/requestService";
import { ApprovalBtn } from "../atoms/ApprovalBtn";
import { DutyBadgeKor } from "../atoms/DutyBadgeKor";

const ReqAdminTable = () => {
	const [requests, setRequests] = useState<WardRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm] = useState("");
	// const [ setSearchTerm] = useState("");

	// 요청 목록 조회
	const fetchRequests = async () => {
		useLoadingStore.getState().setLoading(true);
		try {
			const data = await requestService.getWardRequests();
			setRequests(data);
		} catch (error) {
			toast.error("요청 목록을 불러오는데 실패했습니다");
		} finally {
			useLoadingStore.getState().setLoading(false);
			setIsLoading(false);
		}
	};

	// 상태 변경 처리
	const handleStatusChange = async (
		requestId: number,
		memberId: number,
		status: "ACCEPTED" | "DENIED" | "HOLD",
	) => {
		// 이전 상태 저장
		const prevRequest = requests.find(
			(request) => request.requestId === requestId,
		);
		if (!prevRequest) return;

		// 즉시 UI 업데이트
		setRequests((prevRequests) =>
			prevRequests.map((request) =>
				request.requestId === requestId ? { ...request, status } : request,
			),
		);

		try {
			// 백그라운드에서 API 호출
			await requestService.editRequestStatus(requestId, {
				memberId,
				status,
			});
			toast.success("요청 상태가 변경되었습니다");
		} catch (error) {
			// API 호출 실패 시 이전 상태로 복구
			setRequests((prevRequests) =>
				prevRequests.map((request) =>
					request.requestId === requestId
						? { ...request, status: prevRequest.status }
						: request,
				),
			);
			toast.error("요청 상태 변경에 실패했습니다");
		}
	};

	useEffect(() => {
		fetchRequests();
	}, []);

	// 검색 필터링
	const filteredRequests = requests.filter((request) =>
		request.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="w-full">
			<div className="bg-white rounded-[1.154375rem] p-4 sm:p-6">
				<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-[1rem] px-[0.5rem]">
					<div className="w-full flex justify-between items-center mb-[0.5rem] lg:mb-0">
						<h2 className="text-base lg:text-[1.125rem] font-semibold">
							요청 내역
						</h2>
						{/* <h2 className="text-lg font-semibold">요청 내역</h2> */}
					</div>

					{/* 검색창과 데스크톱용 정렬/필터 */}
					<div className="flex flex-row gap-[0.25rem] lg:gap-[0.5rem] w-full lg:w-auto items-center">
						{/* 검색창 */}
						{/* <div className="w-[140px] lg:w-[260px]">
							<SmallSearchInput
								id="search-nurse"
								name="search-nurse"
								placeholder="이름으로 검색하기"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div> */}
						{/* 모바일 정렬/필터 버튼 */}
						{/* <div className="flex lg:hidden gap-1 ml-auto">
							<SortButton label="정렬" />
							<FilterButton label="필터" />
						</div> */}
						{/* 데스크톱 정렬/필터 버튼 */}
						{/* <div className="hidden lg:flex gap-2 flex-shrink-0">
							<SortButton label="정렬" />
							<FilterButton label="필터" />
						</div> */}
					</div>
				</div>

				{/* 요청 목록 */}
				<div className="overflow-x-auto lg:overflow-x-hidden">
					<table className="w-full min-w-[20rem] md:min-w-[40rem] lg:min-w-0 lg:w-full">
						{/* 헤더 */}
						<thead>
							<tr>
								<th className="bg-base-muted-30 first:rounded-l-xl w-[5rem] lg:w-[7.5rem] p-[0.5rem] text-left whitespace-nowrap">
									<div className="flex justify-center translate-x-[2rem] lg:translate-x-0">
										<span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium mr-[2rem]">
											이름
										</span>
									</div>
								</th>
								<th className="bg-base-muted-30 w-[4rem] lg:w-[5.625rem] p-[0.5rem] whitespace-nowrap">
									<span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
										날짜
									</span>
								</th>
								<th className="bg-base-muted-30 w-[3.5rem] lg:w-[4.125rem] p-[0.5rem] whitespace-nowrap">
									<span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
										근무
									</span>
								</th>
								<th className="bg-base-muted-30 hidden md:table-cell w-[8rem] lg:w-[11.25rem] p-[0.5rem] whitespace-nowrap">
									<span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium text-center block">
										요청 내용
									</span>
								</th>
								<th className="bg-base-muted-30 rounded-r-xl w-auto lg:w-[11.25rem] p-[0.5rem] whitespace-nowrap">
									<div className="flex justify-center translate-x-[0.1rem] lg:translate-x-[4rem]">
										<span className="text-[0.75rem] lg:text-[0.875rem] text-gray-600 font-medium">
											상태
										</span>
									</div>
								</th>
							</tr>
						</thead>

						{/* 요청 목록 본문 */}
						<tbody>
							{filteredRequests.length === 0 ? (
								<tr>
									<td colSpan={5}>
										<div className="flex items-center justify-center h-[25rem] text-gray-500">
											요청 내역이 없습니다.
										</div>
									</td>
								</tr>
							) : (
								filteredRequests.map((request) => (
									<tr
										key={request.requestId}
										className="border-b border-gray-100"
									>
										<td className="w-[5rem] lg:w-[7.5rem] p-[0.5rem]">
											<div className="flex items-center justify-start pl-[0.5rem]">
												<span className="font-medium truncate ml-[0.25rem] lg:ml-[0.5rem] text-[0.75rem] lg:text-[1rem] whitespace-nowrap">
													{request.name}
												</span>
											</div>
										</td>
										<td className="w-[4rem] lg:w-[5.625rem] p-[0.5rem]">
											<div className="text-gray-600 text-[0.75rem] lg:text-[0.875rem] text-center whitespace-nowrap">
												{request.date}
											</div>
										</td>
										<td className="w-[3.5rem] lg:w-[4.125rem] p-[0.5rem]">
											<div className="flex justify-center scale-75 lg:scale-90">
												<DutyBadgeKor
													type={
														request.shift === "D"
															? "day"
															: request.shift === "E"
																? "evening"
																: request.shift === "N"
																	? "night"
																	: "off"
													}
													size="xs"
												/>
											</div>
										</td>
										<td className="hidden md:table-cell w-[8rem] lg:w-[11.25rem] p-[0.5rem]">
											<div className="truncate text-gray-600 text-[0.75rem] lg:text-[0.875rem] text-center whitespace-nowrap">
												{request.memo}
											</div>
										</td>
										<td className="w-auto lg:w-[11.25rem] p-[0.5rem]">
											<div className="flex justify-end items-center h-full whitespace-nowrap">
												<div className="scale-[0.65] lg:scale-90 transform-gpu">
													<ApprovalBtn
														onApprove={() =>
															handleStatusChange(
																request.requestId,
																request.memberId,
																"ACCEPTED",
															)
														}
														onReject={() =>
															handleStatusChange(
																request.requestId,
																request.memberId,
																"DENIED",
															)
														}
														onHold={() =>
															handleStatusChange(
																request.requestId,
																request.memberId,
																"HOLD",
															)
														}
														currentStatus={request.status}
													/>
												</div>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default ReqAdminTable;
