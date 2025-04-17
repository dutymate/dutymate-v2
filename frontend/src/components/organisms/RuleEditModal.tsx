import { useEffect, useState, useRef } from "react";
import { ruleService } from "../../services/ruleService";
import { Button } from "../atoms/Button";
import { toast } from "react-toastify";

interface RuleEditModalProps {
	onClose: () => void;
	buttonRef: React.RefObject<HTMLButtonElement>;
	onRuleUpdate: (newRules: WardRule) => void;
}

interface WardRule {
	// 평일/주말 근무 개수
	wdayDCnt: number;
	wdayECnt: number;
	wdayNCnt: number;
	wendDCnt: number;
	wendECnt: number;
	wendNCnt: number;

	// 나이트 근무 규칙
	maxN: number;
	prioMaxN: number;
	minN: number;
	prioMinN: number;

	// 연속 근무 규칙
	maxShift: number;
	prioMaxShift: number;
}

const getFontWeight = (value: number) => {
	switch (value) {
		case 3:
			return "font-bold";
		case 2:
			return "font-medium";
		case 1:
			return "font-light";
		default:
			return "font-normal";
	}
};

const RuleEditModal = ({ onClose, onRuleUpdate }: RuleEditModalProps) => {
	const [rules, setRules] = useState<WardRule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const modalRef = useRef<HTMLDivElement>(null);

	// 외부 클릭 감지
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	useEffect(() => {
		const fetchRules = async () => {
			try {
				setIsLoading(true);
				const data = await ruleService.getWardRules();
				setRules(data);
			} catch (error) {
				console.error("Failed to fetch rules:", error);
				toast.error("규칙을 불러오는데 실패했습니다");
			} finally {
				setIsLoading(false);
			}
		};
		fetchRules();
	}, []);

	const handleChange = (field: keyof WardRule, value: number) => {
		if (!rules) return;
		setRules((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				[field]: value,
			};
		});
	};

	const handleSubmit = async () => {
		if (!rules) return;

		setIsSubmitting(true);
		try {
			await ruleService.updateWardRules(rules);
			onRuleUpdate(rules);
			toast.success("규칙이 저장되었습니다");
			onClose();
		} catch (error: any) {
			console.error("Failed to update rules:", error);
			if (error.response) {
				switch (error.response.status) {
					case 400:
						toast.error(
							"유효하지 않은 입력 값이 제공되어 규칙 수정을 실패했습니다",
						);
						break;
					case 401:
						toast.error("로그인 토큰이 만료되었습니다");
						window.location.href = "/login";
						break;
					case 404:
						toast.error(
							"병동 ID에 해당하는 규칙이 존재하지 않아 수정을 할 수 없습니다",
						);
						break;
					default:
						toast.error("규칙 저장에 실패했습니다");
						break;
				}
			} else {
				toast.error("규칙 저장에 실패했습니다");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				ref={modalRef}
				className="bg-white rounded-xl shadow-lg w-[22.5rem] max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* 헤더 */}
				<div className="flex rounded-t-xl justify-between bg-primary-bg items-center px-[1rem] py-[0.25rem] border-b">
					<h2 className="text-sm font-medium text-primary-dark">규칙 설정</h2>
					<button
						onClick={onClose}
						className="text-primary hover:text-primary/80"
					>
						<span className="text-lg">×</span>
					</button>
				</div>

				<div className="p-[1rem]">
					{isLoading ? (
						/* 스켈레톤 UI */
						<div className="space-y-[0.5rem] animate-pulse">
							{[...Array(7)].map((_, index) => (
								<div
									key={index}
									className="flex items-center justify-between py-[0.375rem] border-b"
								>
									<div className="h-[1rem] bg-gray-200 rounded w-[6rem]"></div>
									<div className="flex items-center gap-[0.375rem]">
										<div className="h-[1.5rem] bg-gray-200 rounded w-[6rem]"></div>
										<div className="h-[1.5rem] bg-gray-200 rounded w-[6rem]"></div>
									</div>
								</div>
							))}
						</div>
					) : (
						rules && (
							<>
								<div className="space-y-[0.5rem]">
									{/* 자동 적용 규칙 안내 */}
									<div className="flex items-center justify-center gap-[0.25rem] py-[0.5rem] px-[0.25rem] bg-gray-50 rounded font-bold text-xs text-primary">
										<span>ND, ED, NE, NOD 규칙은 자동 적용됩니다.</span>
									</div>

									{/* 평일 근무자 수 */}
									<div className="flex items-center justify-between py-[0.375rem] border-b">
										<span className="text-sm text-foreground">
											평일 근무자 수
										</span>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-day">
													D
												</span>
												<select
													value={rules.wdayDCnt}
													onChange={(e) =>
														handleChange("wdayDCnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-evening">
													E
												</span>
												<select
													value={rules.wdayECnt}
													onChange={(e) =>
														handleChange("wdayECnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-night">
													N
												</span>
												<select
													value={rules.wdayNCnt}
													onChange={(e) =>
														handleChange("wdayNCnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>

									{/* 주말 근무자 수 */}
									<div className="flex items-center justify-between py-[0.375rem] border-b">
										<span className="text-sm text-foreground">
											주말 근무자 수
										</span>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-day">
													D
												</span>
												<select
													value={rules.wendDCnt}
													onChange={(e) =>
														handleChange("wendDCnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-evening">
													E
												</span>
												<select
													value={rules.wendECnt}
													onChange={(e) =>
														handleChange("wendECnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-duty-night">
													N
												</span>
												<select
													value={rules.wendNCnt}
													onChange={(e) =>
														handleChange("wendNCnt", Number(e.target.value))
													}
													className="
                          appearance-none
                          border rounded
                          px-2 py-0.5
                          text-sm
                          bg-white
                          w-12
                          text-foreground
                          text-center
                          cursor-pointer
                          hover:border-primary
                          focus:outline-none
                          focus:ring-1
                          focus:ring-primary
                          focus:border-primary
                        "
												>
													{[...Array(6)].map((_, i) => (
														<option key={i} value={i} className="text-center">
															{i}
														</option>
													))}
												</select>
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

									{/* 연속 근무 수 최대 */}
									<div className="flex items-center justify-between py-[0.375rem] border-b">
										<span className="text-sm text-foreground">
											연속 근무 수 최대
										</span>
										<div className="flex items-center gap-9">
											<div className="flex items-center gap-1.5">
												<select
													value={rules.maxShift}
													onChange={(e) =>
														handleChange("maxShift", Number(e.target.value))
													}
													className="
                            appearance-none
                            border rounded
                            px-2 py-0.5
                            text-sm
                            bg-white
                            w-10
                            text-center
                            cursor-pointer
                            hover:border-primary
                            focus:outline-none
                            focus:ring-1
                            focus:ring-primary
                            focus:border-primary
                        "
												>
													{[...Array(4)].map((_, i) => (
														<option
															key={i + 3}
															value={i + 3}
															className="text-center"
														>
															{i + 3}
														</option>
													))}
												</select>
												<span className="text-xs text-foreground">일 이하</span>
											</div>
											<select
												value={rules.prioMaxShift}
												onChange={(e) =>
													handleChange("prioMaxShift", Number(e.target.value))
												}
												className={`
                        appearance-none
                        border rounded
                        px-2 py-0.5
                        text-xs
                        bg-white
                        w-20
                        text-foreground
                        text-center
                        cursor-pointer
                        hover:border-primary
                        focus:outline-none
                        focus:ring-1
                        focus:ring-primary
                        focus:border-primary
                        ${getFontWeight(rules.prioMaxShift)}
                      `}
											>
												{[
													{ value: 3, label: "매우 중요", weight: "font-bold" },
													{ value: 2, label: "중요", weight: "font-medium" },
													{ value: 1, label: "보통", weight: "font-light" },
												].map((item) => (
													<option
														key={item.value}
														value={item.value}
														className={`text-center ${item.weight}`}
													>
														{item.label}
													</option>
												))}
											</select>
										</div>
									</div>

									{/* 나이트 연속 근무 수 최대 */}
									<div className="flex items-center justify-between py-[0.375rem] border-b">
										<span className="text-sm text-foreground">
											나이트 연속 최대
										</span>
										<div className="flex items-center gap-1.5">
											<select
												value={rules.maxN}
												onChange={(e) =>
													handleChange("maxN", Number(e.target.value))
												}
												className="
                        appearance-none
                        border rounded
                        px-2 py-0.5
                        text-sm
                        bg-white
                        w-10
                        text-center
                        cursor-pointer
                        hover:border-primary
                        focus:outline-none
                        focus:ring-1
                        focus:ring-primary
                        focus:border-primary
                      "
											>
												{[...Array(6)].map((_, i) => (
													<option
														key={i + 2}
														value={i + 2}
														className="text-center"
													>
														{i + 2}
													</option>
												))}
											</select>
											<span className="text-xs text-foreground">일 이하</span>
											<select
												value={rules.prioMaxN}
												onChange={(e) =>
													handleChange("prioMaxN", Number(e.target.value))
												}
												className={`                        appearance-none
                        border rounded
                        px-2 py-0.5
                        text-xs
                        bg-white
                        w-20
                        text-foreground
                        text-center
                        cursor-pointer
                        hover:border-primary
                        focus:outline-none
                        focus:ring-1
                        focus:ring-primary
                        focus:border-primary
                        ${getFontWeight(rules.prioMaxN)}
                      `}
											>
												{[
													{ value: 3, label: "매우 중요", weight: "font-bold" },
													{ value: 2, label: "중요", weight: "font-medium" },
													{ value: 1, label: "보통", weight: "font-light" },
												].map((item) => (
													<option
														key={item.value}
														value={item.value}
														className={`text-center ${item.weight}`}
													>
														{item.label}
													</option>
												))}
											</select>
										</div>
									</div>

									{/* 나이트 연속 근무 수 최소 */}
									<div className="flex items-center justify-between py-[0.375rem] border-b">
										<span className="text-sm text-foreground">
											나이트 연속 최소
										</span>
										<div className="flex items-center gap-1.5">
											<select
												value={rules.minN}
												onChange={(e) =>
													handleChange("minN", Number(e.target.value))
												}
												className="
                        appearance-none
                        border rounded
                        px-2 py-0.5
                        text-sm
                        bg-white
                        w-10
                        text-center
                        cursor-pointer
                        hover:border-primary
                        focus:outline-none
                        focus:ring-1
                        focus:ring-primary
                        focus:border-primary
                      "
											>
												{[...Array(6)].map((_, i) => (
													<option key={i} value={i} className="text-center">
														{i}
													</option>
												))}
											</select>
											<span className="text-xs text-foreground">일 이상</span>
											<select
												value={rules.prioMinN}
												onChange={(e) =>
													handleChange("prioMinN", Number(e.target.value))
												}
												className={`
                        appearance-none
                        border rounded
                        px-2 py-0.5
                        text-xs
                        bg-white
                        w-20
                        text-foreground
                        text-center
                        cursor-pointer
                        hover:border-primary
                        focus:outline-none
                        focus:ring-1
                        focus:ring-primary
                        focus:border-primary
                        ${getFontWeight(rules.prioMinN)}
                      `}
											>
												{[
													{ value: 3, label: "매우 중요", weight: "font-bold" },
													{ value: 2, label: "중요", weight: "font-medium" },
													{ value: 1, label: "보통", weight: "font-light" },
												].map((item) => (
													<option
														key={item.value}
														value={item.value}
														className={`text-center ${item.weight}`}
													>
														{item.label}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>

								{/* 저장 버튼 */}
								<div className="flex justify-end gap-[0.25rem] mt-[0.75rem]">
									<Button
										size="xs"
										color="muted"
										onClick={onClose}
										disabled={isSubmitting}
									>
										취소
									</Button>
									<Button
										size="xs"
										color="primary"
										onClick={handleSubmit}
										disabled={isSubmitting}
									>
										{isSubmitting ? "저장 중..." : "저장"}
									</Button>
								</div>
							</>
						)
					)}
				</div>
			</div>
		</div>
	);
};

export default RuleEditModal;
