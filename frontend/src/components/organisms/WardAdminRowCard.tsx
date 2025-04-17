// import { FaUserCircle } from "react-icons/fa";
import { Icon, IconName } from "../atoms/Icon";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import { Nurse } from "../../services/wardService";
import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "../atoms/Badge";
import { Dropdown } from "../atoms/Dropdown";
import useWardStore from "../../store/wardStore";
import { toast } from "react-toastify";
import useUserAuthStore from "@/store/userAuthStore";
import { useNavigate } from "react-router-dom";
import DutyTooltip from "../atoms/DutyTooltip";

interface WardAdminRowCardProps {
	nurse: Nurse;
	onUpdate: (memberId: number, data: any) => void;
	isSelected?: boolean;
	onSelect?: (memberId: number) => void;
	useCustomDutyLabels?: boolean;
}
const WardAdminRowCard = ({
	nurse,
	onUpdate,
	useCustomDutyLabels = false,
}: WardAdminRowCardProps) => {
	if (!nurse) {
		return null;
	}

	const [openSkillDropdown, setOpenSkillDropdown] = useState(false);
	const [isEditingMemo, setIsEditingMemo] = useState(false);
	const [memo, setMemo] = useState(nurse.memo ?? "");
	const memoInputRef = useRef<HTMLInputElement>(null);
	const { removeNurse, updateVirtualNurseName, updateVirtualNurseInfo } =
		useWardStore();
	const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">(
		"bottom",
	);
	const authorityDropdownRef = useRef<HTMLDivElement>(null);
	const skillButtonRef = useRef<HTMLButtonElement>(null);
	const skillDropdownRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isEditingName, setIsEditingName] = useState(false);
	const [name, setName] = useState(nurse.name);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
	const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
	const genderDropdownRef = useRef<HTMLDivElement>(null);
	const gradeDropdownRef = useRef<HTMLDivElement>(null);

	const userAuthStore = useUserAuthStore();
	const navigate = useNavigate();

	// Add this to verify data flow
	useEffect(() => {
		// console.log("Nurse data:", nurse);
	}, [nurse]);

	const updateDropdownPosition = useCallback(
		(buttonRef: React.RefObject<HTMLElement>) => {
			if (!buttonRef.current || !containerRef.current) return;

			const buttonRect = buttonRef.current.getBoundingClientRect();
			// const containerRect = containerRef.current.getBoundingClientRect();
			const scrollableParent = getScrollableParent(containerRef.current);
			const scrollableRect = scrollableParent.getBoundingClientRect();

			// Calculate space below within the scrollable container
			const spaceBelow = scrollableRect.bottom - buttonRect.bottom;
			const spaceAbove = buttonRect.top - scrollableRect.top;

			// Use the larger space, with a preference for below if equal
			setDropdownPosition(spaceBelow >= spaceAbove ? "bottom" : "top");
		},
		[],
	);

	// Helper function to find the nearest scrollable parent
	const getScrollableParent = (element: HTMLElement): HTMLElement => {
		const isScrollable = (el: HTMLElement) => {
			const style = window.getComputedStyle(el);
			const overflowY = style.overflowY;
			return overflowY !== "visible" && overflowY !== "hidden";
		};

		let parent = element.parentElement;
		while (parent) {
			if (isScrollable(parent)) return parent;
			parent = parent.parentElement;
		}
		return document.body;
	};

	// Update authority dropdown position
	useEffect(() => {
		const handlePositionUpdate = () =>
			updateDropdownPosition(authorityDropdownRef);

		handlePositionUpdate();
		window.addEventListener("scroll", handlePositionUpdate, true); // Use capture phase
		window.addEventListener("resize", handlePositionUpdate);

		return () => {
			window.removeEventListener("scroll", handlePositionUpdate, true);
			window.removeEventListener("resize", handlePositionUpdate);
		};
	}, [updateDropdownPosition]);

	// Update skill dropdown position
	useEffect(() => {
		const handlePositionUpdate = () => updateDropdownPosition(skillButtonRef);

		handlePositionUpdate();
		window.addEventListener("scroll", handlePositionUpdate, true);
		window.addEventListener("resize", handlePositionUpdate);

		return () => {
			window.removeEventListener("scroll", handlePositionUpdate, true);
			window.removeEventListener("resize", handlePositionUpdate);
		};
	}, [updateDropdownPosition]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				skillDropdownRef.current &&
				skillButtonRef.current &&
				!skillDropdownRef.current.contains(event.target as Node) &&
				!skillButtonRef.current.contains(event.target as Node)
			) {
				setOpenSkillDropdown(false);
			}
			if (
				genderDropdownRef.current &&
				!genderDropdownRef.current.contains(event.target as Node)
			) {
				setIsGenderDropdownOpen(false);
			}
			if (
				gradeDropdownRef.current &&
				!gradeDropdownRef.current.contains(event.target as Node)
			) {
				setIsGradeDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const skillOptions = [
		{ value: "HIGH" as "HIGH", icon: "high" as const, label: "상급" },
		{ value: "MID" as "MID", icon: "mid" as const, label: "중급" },
		{ value: "LOW" as "LOW", icon: "low" as const, label: "초급" },
	];

	const handleSkillChange = (skillLevel: "HIGH" | "MID" | "LOW") => {
		onUpdate(nurse.memberId, {
			skillLevel,
			shift: nurse.shift || null,
			memo: nurse.memo || "",
			role: nurse.role,
		});
		setOpenSkillDropdown(false);
	};

	const handleShiftChange = (shift: "D" | "E" | "N" | "ALL") => {
		onUpdate(nurse.memberId, {
			shift,
			skillLevel: nurse.skillLevel || null,
			memo: nurse.memo || "",
			role: nurse.role,
		});
	};

	// 메모 수정 완료 핸들러
	const handleMemoComplete = () => {
		if (!memo) {
			setIsEditingMemo(false);
			return;
		}

		if (memo.length > 50) {
			toast.error("메모는 최대 50자까지 작성 가능합니다.");
			return;
		}

		setIsEditingMemo(false);
		if (memo !== nurse.memo) {
			onUpdate(nurse.memberId, {
				memo,
				shift: nurse.shift || null,
				skillLevel: nurse.skillLevel || null,
				role: nurse.role,
			});
		}
	};

	// 메모 입력 중 Enter 키 처리
	const handleMemoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleMemoComplete();
		}
	};

	const handleRemoveNurse = async () => {
		try {
			// 관리자 본인 : 병동 관리 페이지에서 내보내기 불가(마이페이지로 이동)
			if (nurse.memberId === userAuthStore.userInfo?.memberId) {
				const confirm = window.confirm(
					"관리자는 마이페이지에서 병동 나가기를 통해 병동을 나갈 수 있습니다. 마이페이지로 이동하시겠습니까?",
				);
				if (confirm) {
					navigate("/my-page");
				}
				return;
			}

			// 본인 제외 관리자 : 병동 내보내기 시, confirm 띄우기기
			if (
				nurse.memberId !== userAuthStore.userInfo?.memberId &&
				nurse.role === "HN"
			) {
				const confirm = window.confirm("관리자를 내보내시겠습니까?");
				if (confirm) {
					await removeNurse(nurse.memberId);
				}
				return;
			}
			// 그 외 내보내기
			await removeNurse(nurse.memberId);
			toast.success("간호사가 병동에서 제외되었습니다");
		} catch (error) {
			if (error instanceof Error && error.message === "LAST_HN") {
				toast.error("새로운 관리자를 임명하세요.");
				return;
			}
			toast.error("간호사 제외에 실패했습니다.");
		}
	};

	const handleChangeNurseRole = async () => {
		if (!nurse.isSynced) {
			toast.error("임시 간호사는 관리자 권한 부여가 불가합니다.");
			return;
		}

		if (nurse.role !== "HN") {
			onUpdate(nurse.memberId, {
				...nurse,
				role: "HN",
			});
		} else {
			toast.error("관리자는 권한 변경이 불가합니다.");
			return;
		}
	};

	const handleNameComplete = async () => {
		if (!nurse.isSynced && name !== nurse.name) {
			try {
				await updateVirtualNurseName(nurse.memberId, name);
				toast.success("이름이 수정되었습니다.");
			} catch (error: any) {
				toast.error(error.response.data.message);
				setName(nurse.name);
			}
		}
		setIsEditingName(false);
	};

	const handleGenderChange = async (gender: "F" | "M") => {
		if (!nurse.isSynced && gender !== nurse.gender) {
			try {
				await updateVirtualNurseInfo(nurse.memberId, { gender });
				setIsGenderDropdownOpen(false);
				toast.success("성별이 수정되었습니다.");
			} catch (error) {
				toast.error("성별 수정에 실패했습니다.");
			}
		}
	};

	const handleGradeChange = async (grade: number) => {
		if (!nurse.isSynced && grade !== nurse.grade) {
			try {
				await updateVirtualNurseInfo(nurse.memberId, { grade });
				setIsGradeDropdownOpen(false);
				toast.success("연차가 수정되었습니다.");
			} catch (error) {
				toast.error("연차 수정에 실패했습니다.");
			}
		}
	};

	const getDutyLabel = (duty: "D" | "N" | "ALL") => {
		if (useCustomDutyLabels && duty === "D") {
			return {
				label: "D",
				useSmallText: true,
			};
		}
		if (duty === "ALL") {
			return {
				label: "All",
				useSmallText: false,
			};
		}
		return {
			label: duty,
			useSmallText: false,
		};
	};

	const getDutyMessage = (duty: "D" | "N" | "ALL") => {
		switch (duty) {
			case "D":
				return "평일 Day 근무만 해요.";
			case "N":
				return "Night 전담 근무자에요.";
			case "ALL":
				return "평간호사에요.";
			default:
				return "";
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<div className="flex items-center p-1.5 lg:p-2 bg-white rounded-xl border border-gray-100">
				<div className="flex items-center justify-between flex-1 gap-[2.5rem]">
					<div className="flex items-center gap-[1.5rem] flex-shrink-0">
						<div className="flex items-center gap-3 w-[9rem] pl-[0.5rem] group relative">
							{!nurse.isSynced && (
								<div className="flex-1 items-center">
									{isEditingName ? (
										<input
											ref={nameInputRef}
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											onBlur={handleNameComplete}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleNameComplete();
												if (e.key === "Escape") {
													setName(nurse.name);
													setIsEditingName(false);
												}
											}}
											autoFocus
											className="w-full rounded px-[0.5rem] py-[0.25rem] text-[0.875rem] border border-primary-dark"
										/>
									) : (
										<div className="flex items-center w-full overflow-hidden">
											<span className="w-0 flex-1 truncate text-duty-off">
												{name}
											</span>
											<button
												onClick={() => setIsEditingName(true)}
												className="opacity-0 group-hover:opacity-100 transition-opacity ml-[0.25rem]"
											>
												<Icon
													name="edit"
													size={16}
													className="text-gray-400 hover:text-primary-dark"
												/>
											</button>
										</div>
									)}
								</div>
							)}
							{nurse.isSynced && (
								<span className="w-0 flex-1 truncate">{nurse.name}</span>
							)}
						</div>
						<div className="w-[3.75rem] flex items-center">
							<Badge type={nurse.role} className="whitespace-nowrap" />
						</div>
						<div className="relative" ref={genderDropdownRef}>
							<button
								onClick={() =>
									!nurse.isSynced &&
									setIsGenderDropdownOpen(!isGenderDropdownOpen)
								}
								className={`flex items-center gap-[0.25rem] w-[3.75rem] p-[0.25rem] rounded ${
									!nurse.isSynced ? "hover:bg-gray-50" : "cursor-not-allowed"
								}`}
							>
								<Icon
									name={nurse.gender === "F" ? "female" : "male"}
									size={16}
									className="text-gray-500"
								/>
								<span>{nurse.gender === "F" ? "여자" : "남자"}</span>
							</button>
							{isGenderDropdownOpen && !nurse.isSynced && (
								<div className="absolute top-full left-0 mt-[0.25rem] bg-white shadow-lg rounded-lg border border-gray-200 z-10 w-[5rem]">
									<button
										onClick={() => handleGenderChange("F")}
										className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 whitespace-nowrap"
									>
										<Icon
											name="female"
											size={16}
											className="text-gray-500 flex-shrink-0"
										/>
										<span className="flex-shrink-0">여자</span>
									</button>
									<button
										onClick={() => handleGenderChange("M")}
										className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 whitespace-nowrap"
									>
										<Icon
											name="male"
											size={16}
											className="text-gray-500 flex-shrink-0"
										/>
										<span className="flex-shrink-0">남자</span>
									</button>
								</div>
							)}
						</div>
						<div className="relative" ref={gradeDropdownRef}>
							<button
								onClick={() =>
									!nurse.isSynced &&
									setIsGradeDropdownOpen(!isGradeDropdownOpen)
								}
								className={`flex items-center gap-1 w-[90px] p-1 rounded justify-center ${
									!nurse.isSynced ? "hover:bg-gray-50" : "cursor-not-allowed"
								}`}
							>
								<div className="flex items-center justify-center w-full">
									<Icon
										name="idCard"
										size={16}
										className="text-gray-500 flex-shrink-0"
									/>
									<span className="ml-1 truncate">{nurse.grade}년차</span>
								</div>
							</button>
							{isGradeDropdownOpen && !nurse.isSynced && (
								<div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 z-10 w-[100px] max-h-[150px] overflow-y-auto overflow-x-hidden">
									{[...Array(50).keys()].map((grade) => (
										<button
											key={grade + 1}
											onClick={() => handleGradeChange(grade + 1)}
											className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 whitespace-nowrap"
										>
											<Icon
												name="idCard"
												size={16}
												className="text-gray-500 flex-shrink-0"
											/>
											<span>{grade + 1}년차</span>
										</button>
									))}
								</div>
							)}
						</div>
						<div className="relative w-[5rem]">
							<button
								className="flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] border rounded hover:bg-gray-50"
								onClick={() => setOpenSkillDropdown(!openSkillDropdown)}
								ref={skillButtonRef}
							>
								<Icon
									name={(nurse.skillLevel?.toLowerCase() ?? "low") as IconName}
									size={16}
								/>
								<span className="text-[0.875rem]">
									{
										skillOptions.find((opt) => opt.value === nurse.skillLevel)
											?.label
									}
								</span>
							</button>

							{openSkillDropdown && (
								<div
									ref={skillDropdownRef}
									className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"} left-0 bg-white border rounded-md shadow-lg z-10`}
								>
									{skillOptions.map((option) => (
										<button
											key={option.value}
											className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full"
											onClick={() => handleSkillChange(option.value)}
										>
											<Icon name={option.icon} size={16} />
											<span className="text-sm">{option.label}</span>
										</button>
									))}
								</div>
							)}
						</div>
						<div className="flex gap-[0.5rem] w-[9.6875rem]">
							{(["D", "N", "ALL"] as const).map((duty) => {
								const dutyDisplay = getDutyLabel(duty);
								return (
									<DutyTooltip key={duty} message={getDutyMessage(duty)}>
										<DutyBadgeEng
											type={duty}
											size="md"
											variant={nurse.shift === duty ? "filled" : "outline"}
											onClick={() => handleShiftChange(duty)}
											isSelected={nurse.shift === duty}
											customLabel={dutyDisplay.label}
											useSmallText={dutyDisplay.useSmallText}
										/>
									</DutyTooltip>
								);
							})}
						</div>
					</div>
					<div className="flex items-center gap-[1.5rem] flex-1 min-w-0">
						<div className="relative flex-1 min-w-0 group">
							{isEditingMemo ? (
								<div className="flex w-full">
									<div className="flex-1 min-w-0 overflow-hidden">
										<input
											ref={memoInputRef}
											type="text"
											value={memo}
											onChange={(e) => setMemo(e.target.value)}
											onBlur={handleMemoComplete}
											onKeyDown={handleMemoKeyDown}
											autoFocus
											maxLength={50}
											className="w-full rounded px-[0.75rem] py-[0.25rem] text-[0.875rem] border outline-primary-40 truncate"
											placeholder="메모를 입력하세요"
										/>
									</div>
									<div className="w-[3.75rem] lg:hidden flex-shrink-0" />
								</div>
							) : (
								<div className="flex w-full">
									<div className="flex items-center w-full min-w-0 overflow-hidden">
										<span className="w-0 flex-1 truncate text-gray-500">
											{memo || "메모 없음"}
										</span>
										<button
											onClick={() => {
												setIsEditingMemo(true);
												setTimeout(() => memoInputRef.current?.focus(), 0);
											}}
											className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
										>
											<Icon
												name="edit"
												size={16}
												className="text-gray-400 hover:text-primary-dark"
											/>
										</button>
									</div>
									<div className="w-[3.75rem] lg:hidden flex-shrink-0" />
								</div>
							)}
						</div>
						<div
							className="w-[3.75rem] flex-shrink-0 absolute right-0 lg:relative"
							ref={authorityDropdownRef}
						>
							<Dropdown
								variant="authority"
								value={null}
								onChange={(value) => {
									if (value === "병동 내보내기") {
										handleRemoveNurse();
									} else if (value === "권한 넘기기") {
										handleChangeNurseRole();
									}
								}}
								label=""
								position={
									dropdownPosition === "top" ? "top-left" : "bottom-left"
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WardAdminRowCard;
