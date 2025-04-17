// ShiftAdminTable.tsx
import * as XLSX from "xlsx";
import RuleEditModal from "./RuleEditModal";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { ProgressChecker } from "../atoms/ProgressChecker";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { dutyService } from "../../services/dutyService";
import { toast } from "react-toastify";
import useShiftStore from "../../store/shiftStore";
import FaultLayer from "../atoms/FaultLayer";
import { toPng } from "html-to-image";
import { requestService, WardRequest } from "../../services/requestService";
import RequestStatusLayer from "../atoms/RequestStatusLayer";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "../atoms/Tooltip";
import KeyboardGuide from "../atoms/KeyboardGuide";
import { memo } from "react";
import {
	getDefaultOffDays,
	getMaxAllowedMonth,
	isHoliday,
} from "../../utils/dateUtils";
import NurseCountModal from "./NurseCountModal";
import { ruleService } from "../../services/ruleService";
import { WardRule } from "../../services/ruleService";
import AutoGenerateConfirmModal from "./AutoGenerateConfirmModal";

// 근무표 관리자 테이블의 props 인터페이스
interface ShiftAdminTableProps {
	dutyData: {
		// 간호사별 근무 데이터
		memberId: number;
		name: string;
		role: "HN" | "RN";
		prevShifts: string; // 이전 달 마지막 주 근무
		shifts: string; // 현재 달 근무
	}[];
	invalidCnt: number; // 규칙 위반 수
	year: number; // 년도
	month: number; // 월
	onUpdate: (year: number, month: number, historyIdx?: number) => Promise<void>; // 업데이트 핸들러
	issues: {
		// 근무표 문제점 목록
		memberId: number; // name 대신 memberId 사용
		startDate: number;
		endDate: number;
		endDateShift: string;
		message: string;
	}[];
}

// 근무 타입 정의 (D: 데이, E: 이브닝, N: 나이트, O: 오프, X: 미지정, ALL: 전체)
type DutyType = "D" | "E" | "N" | "O" | "X" | "ALL";
// 유효한 근무 타입 (X와 ALL 제외)
type ValidDutyType = Exclude<DutyType, "X" | "ALL">;
// 근무 타입별 카운트 인터페이스
type DutyCounts = {
	[key in ValidDutyType]: number;
} & { total?: number };

// 유효한 근무 타입인지 확인하는 타입 가드 함수
const isValidDuty = (duty: string): duty is ValidDutyType => {
	return duty === "D" || duty === "E" || duty === "N" || duty === "O";
};

// Cell 컴포넌트를 분리하여 최적화
interface CellProps {
	nurse: string;
	dayIndex: number;
	duty: string;
	isSelected: boolean;
	violations: any[];
	requestStatus: any;
	isHovered: boolean;
	onClick: () => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	highlightClass: string;
}

// 개별 근무 셀 컴포넌트 (성능 최적화를 위해 memo로 래핑)
const DutyCell = memo(
	({
		nurse,
		dayIndex,
		duty,
		isSelected,
		violations,
		requestStatus,
		isHovered,
		onClick,
		onMouseEnter,
		onMouseLeave,
		highlightClass,
	}: CellProps) => {
		// 규칙 위반이 시작되는 날짜인지 확인
		const isAnyViolationStart = violations.some(
			(v) => dayIndex + 1 === v.startDate,
		);

		return (
			<td
				onClick={onClick}
				className={`p-0 text-center border-r border-gray-200 relative ${highlightClass}`}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<div
					className="flex items-center justify-center cursor-pointer relative outline-none"
					tabIndex={0}
					role="button"
					onClick={onClick}
					aria-label={`${nurse}의 ${dayIndex + 1}일 근무`}
					style={{
						WebkitTapHighlightColor: "transparent",
					}}
				>
					{isAnyViolationStart && (
						<FaultLayer
							key={`violations-${dayIndex + 1}`}
							startDate={dayIndex + 1}
							endDate={Math.max(
								...violations
									.filter((v) => v.startDate === dayIndex + 1)
									.map((v) => v.endDate),
							)}
							messages={violations
								.filter((v) => v.startDate === dayIndex + 1)
								.map((v) => v.message)}
							total={violations.length}
							className={isHovered ? "opacity-90" : ""}
						/>
					)}
					{requestStatus && (
						<RequestStatusLayer
							date={dayIndex + 1}
							status={requestStatus.status}
							message={requestStatus.memo}
							className={isHovered ? "opacity-90" : ""}
						/>
					)}
					<div className="relative z-[2]">
						<div className="scale-[0.95]">
							<DutyBadgeEng
								type={duty as "D" | "E" | "N" | "O" | "X"}
								size="sm"
								isSelected={isSelected}
							/>
						</div>
					</div>
				</div>
			</td>
		);
	},
);

DutyCell.displayName = "DutyCell";

const ShiftAdminTable = ({
	dutyData = [],
	year,
	month,
	onUpdate,
	issues = [],
}: ShiftAdminTableProps) => {
	const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
	const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
	const [isLoading] = useState(false);
	const ruleButtonRef = useRef<HTMLButtonElement>(null);
	const tableRef = useRef<HTMLDivElement>(null);

	const selectedCell = useShiftStore((state) => state.selectedCell);
	const setSelectedCell = useShiftStore((state) => state.setSelectedCell);

	// Add hover state management at component level
	const [hoveredCell, setHoveredCell] = useState<{
		row: number;
		day: number;
	} | null>(null);

	// 현재 달의 일수 계산을 상단으로 이동
	const daysInMonth = new Date(year, month, 0).getDate();

	// Memoize heavy calculations
	const nurses = useMemo(() => dutyData.map((nurse) => nurse.name), [dutyData]);

	// duties 상태 초기화를 단순화
	const [duties, setDuties] = useState<string[][]>([]);

	// useEffect를 추가하여 dutyData 변경 시 duties 업데이트
	useEffect(() => {
		if (!dutyData || !dutyData.length) {
			setDuties([]);
			return;
		}

		setDuties(
			dutyData.map((nurse) => {
				if (!nurse.shifts || nurse.shifts.length === 0) {
					return Array(daysInMonth).fill("X");
				}
				return nurse.shifts.split("");
			}),
		);
	}, [dutyData, daysInMonth]);

	const prevShifts = useMemo(
		() => dutyData.map((nurse) => nurse.prevShifts.split("")),
		[dutyData],
	);

	const [pendingRequests, setPendingRequests] = useState<any[]>([]);

	const sendBatchRequest = useCallback(
		debounce(async (requests) => {
			try {
				// Start timing the batch request
				console.time("BatchRequestTime");

				// Send the batched requests to the server
				await dutyService.updateShiftBatch(requests);

				// Fetch the updated duty data
				const updatedData = await dutyService.getDuty({ year, month });

				// Update the state with the new data
				useShiftStore.getState().setDutyInfo(updatedData);

				// Clear the pending requests
				setPendingRequests([]);

				// End timing after the get request is completed
				console.timeEnd("BatchRequestTime");
			} catch (error) {
				console.error("Failed to update shifts:", error);
				// Optionally, revert the optimistic update or notify the user
				toast.error("근무표 수정에 실패했습니다. 다시 시도해주세요.", {
					position: "bottom-left",
					autoClose: 1000,
				});
			}
		}, 1000),
		[year, month],
	);

	// 근무 변경을 처리하는 핸들러 함수
	const handleShiftChange = useCallback(
		(
			nurseIndex: number,
			dayIndex: number,
			shift: "D" | "E" | "N" | "O" | "X",
		) => {
			// nurseIndex나 dayIndex가 유효한지 확인
			if (!duties[nurseIndex] || dayIndex < 0 || dayIndex >= daysInMonth) {
				console.error("Invalid nurse index or day index");
				return;
			}

			const nurse = dutyData[nurseIndex];
			if (!nurse) {
				console.error("Nurse not found");
				return;
			}

			const currentShift = duties[nurseIndex][dayIndex];

			// 현재 근무와 동일한 경우 변경하지 않음
			if (currentShift === shift) return;

			// UI 즉시 업데이트 (낙관적 업데이트)
			const updatedDuties = duties.map((nurseShifts, idx) => {
				if (idx === nurseIndex) {
					const newShifts = [...nurseShifts];
					newShifts[dayIndex] = shift;
					return newShifts;
				}
				return nurseShifts;
			});

			setDuties(updatedDuties);

			// 서버 요청 준비
			const request = {
				year,
				month,
				history: {
					memberId: nurse.memberId,
					name: nurse.name,
					before: currentShift,
					after: shift,
					modifiedDay: dayIndex + 1,
					isAutoCreated: false,
				},
			};

			// 대기 중인 요청 목록에 새로운 요청 추가
			setPendingRequests((prevRequests) => [...prevRequests, request]);

			// 디바운스된 일괄 처리 함수 호출
			sendBatchRequest([...pendingRequests, request]);
		},
		[
			dutyData,
			year,
			month,
			pendingRequests,
			sendBatchRequest,
			duties,
			daysInMonth,
		],
	);

	// 키보드 이벤트 핸들러
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!selectedCell) return;
			const { row, col } = selectedCell;

			// 방향키 및 삭제 키 처리
			if (!e.repeat) {
				// 키를 꾹 누르고 있을 때는 무시
				switch (e.key) {
					case "ArrowRight":
						e.preventDefault(); // 스크롤 방지
						if (col < daysInMonth - 1) {
							setSelectedCell({ row, col: col + 1 });
						} else if (row < nurses.length - 1) {
							setSelectedCell({ row: row + 1, col: 0 });
						}
						break;
					case "ArrowLeft":
						e.preventDefault(); // 스크롤 방지
						if (col > 0) {
							setSelectedCell({ row, col: col - 1 });
						} else if (row > 0) {
							setSelectedCell({ row: row - 1, col: daysInMonth - 1 });
						}
						break;
					case "ArrowUp":
						e.preventDefault(); // 스크롤 방지
						if (row > 0) {
							setSelectedCell({ row: row - 1, col });
						}
						break;
					case "ArrowDown":
						e.preventDefault(); // 스크롤 방지
						if (row < nurses.length - 1) {
							setSelectedCell({ row: row + 1, col });
						}
						break;
					case "Delete":
						handleShiftChange(row, col, "X");
						break;
					case "Backspace":
						handleShiftChange(row, col, "X");
						if (col > 0) {
							setSelectedCell({ row, col: col - 1 });
						} else if (row > 0) {
							setSelectedCell({ row: row - 1, col: daysInMonth - 1 });
						}
						break;
				}
			}

			// 근무 입력 키 처리 (한/영 모두 지원)
			if (!e.repeat && col >= 0 && col < daysInMonth) {
				const key = e.key.toUpperCase();
				const validKeys = [
					"D",
					"E",
					"N",
					"O",
					"X",
					"ㅇ",
					"ㄷ",
					"ㅜ",
					"ㅐ",
					"ㅌ",
				];
				const keyMap: { [key: string]: "D" | "E" | "N" | "O" | "X" } = {
					ㅇ: "D",
					ㄷ: "E",
					ㅜ: "N",
					ㅐ: "O",
					ㅌ: "X",
				};

				if (validKeys.includes(key)) {
					const shiftKey = keyMap[key] || key;
					handleShiftChange(row, col, shiftKey as "D" | "E" | "N" | "O" | "X");

					if (col < daysInMonth - 1) {
						setSelectedCell({ row, col: col + 1 });
					} else if (row < nurses.length - 1) {
						setSelectedCell({ row: row + 1, col: 0 });
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectedCell, nurses.length, daysInMonth, handleShiftChange]);

	// 셀 클릭 핸들러 (선택만 하고 변경은 하지 않음)
	const handleCellClick = (row: number, col: number) => {
		setSelectedCell({ row, col });
	};

	// 이전 달로 이동
	const handlePrevMonth = () => {
		const newYear = month === 1 ? year - 1 : year;
		const newMonth = month === 1 ? 12 : month - 1;

		// URL 업데이트 및 페이지 새로고침
		window.location.href = `/shift-admin?year=${newYear}&month=${newMonth}`;
	};

	// 다음 달로 이동
	const handleNextMonth = () => {
		const maxAllowed = getMaxAllowedMonth();

		// Calculate next month
		const nextMonth = month === 12 ? 1 : month + 1;
		const nextYear = month === 12 ? year + 1 : year;

		// Check if next month exceeds the limit
		if (
			nextYear > maxAllowed.year ||
			(nextYear === maxAllowed.year && nextMonth > maxAllowed.month)
		) {
			toast.warning("다음 달까지만 조회할 수 있습니다.", {
				position: "top-center",
				autoClose: 2000,
			});
			return;
		}

		// URL 업데이트 및 페이지 새로고침
		window.location.href = `/shift-admin?year=${nextYear}&month=${nextMonth}`;
	};

	// Memoize duty counts calculation
	const dutyCounts = useMemo(() => {
		return Array.from({ length: 31 }, (_, dayIndex) => {
			const counts: DutyCounts = {
				D: 0,
				E: 0,
				N: 0,
				O: 0,
				total: 0,
			};

			duties.forEach((nurseShifts: string[]) => {
				const shift = nurseShifts[dayIndex];
				if (shift && isValidDuty(shift)) {
					counts[shift]++;
					counts.total!++;
				}
			});

			return counts;
		});
	}, [duties]);

	// Update nurse duty counts calculation with proper types
	const nurseDutyCounts = useMemo(() => {
		if (!duties || !duties.length) return [];

		return duties.map((nurseShifts: string[] = []) => {
			const counts: Omit<DutyCounts, "total"> = {
				D: 0,
				E: 0,
				N: 0,
				O: 0,
			};

			if (nurseShifts) {
				nurseShifts.forEach((shift: string) => {
					if (shift && isValidDuty(shift)) {
						counts[shift]++;
					}
				});
			}

			return counts;
		});
	}, [duties]);

	// 주말 및 공휴일 체크
	const isHolidayDay = (day: number) => {
		return isHoliday(year, month, day);
	};

	// 셀 하이라이트 로직
	const isHighlighted = (row: number, col: number) => {
		if (!selectedCell) return "";

		const baseHighlight = "transition-all duration-100";

		// 선택된 셀 자체의 하이라이트
		if (row === selectedCell.row && col === selectedCell.col) {
			return `${baseHighlight} bg-duty-off-bg ring-2 ring-primary ring-offset-2 z-[0]`;
		}

		// 같은 행 하이라이트 (이름과 이전 근무 포함)
		if (row === selectedCell.row) {
			// 이름 열
			if (col === -2) return `${baseHighlight} bg-duty-off-bg rounded-l-lg`;
			// 이전 근무 열
			if (col === -1) return `${baseHighlight} bg-duty-off-bg`;
			// 일반 근무 열
			if (col >= 0 && col < 31) {
				if (col === 0) return `${baseHighlight} bg-duty-off-bg`;
				return `${baseHighlight} bg-duty-off-bg`;
			}
			// 통계 열
			if (col >= 31) {
				if (col === 34) return `${baseHighlight} bg-duty-off-bg rounded-r-lg`;
				return `${baseHighlight} bg-duty-off-bg`;
			}
		}

		// 같은 열 하이라이트
		if (selectedCell.col === col) {
			if (row === 0) return `${baseHighlight} bg-duty-off-bg rounded-t-lg`;
			if (row === nurses.length - 1) return `${baseHighlight} bg-duty-off-bg`;
			return `${baseHighlight} bg-duty-off-bg`;
		}

		return "";
	};

	// Memoize progress calculation
	const progress = useMemo(() => {
		const totalCells = nurses.length * daysInMonth;
		const filledCells = duties.reduce(
			(acc: number, nurseRow: string[]) =>
				acc + nurseRow.filter((duty: string) => duty !== "X").length,
			0,
		);

		const issueCnt = issues.reduce((acc: number, issue) => {
			return acc + (issue.endDate - issue.startDate + 1);
		}, 0);

		const progress = ((filledCells - issueCnt) / totalCells) * 100;
		return Math.max(0, Math.round(progress));
	}, [nurses.length, daysInMonth, duties, issues]);

	// Add a state to track if auto-create is in progress
	const [isAutoCreating, setIsAutoCreating] = useState(false);

	// 모든 셀이 X인지 확인하는 함수
	const isAllCellsEmpty = useMemo(() => {
		return duties.every((nurseShifts) =>
			nurseShifts.every((shift) => shift === "X" || !shift),
		);
	}, [duties]);

	// Modify handleResetDuty to prevent full page reload
	const handleResetDuty = async () => {
		// 모든 셀이 이미 X인 경우
		if (isAllCellsEmpty) {
			toast.warning("이미 초기화되었습니다.", {
				position: "top-center",
				autoClose: 1000,
			});
			return;
		}

		const confirm = window.confirm(
			"듀티표와 수정 기록이 초기화 됩니다. 듀티표를 초기화하시겠습니까?",
		);
		if (!confirm) return;

		try {
			// API 호출
			const data = await dutyService.resetDuty(year, month);

			// 받아온 데이터로 직접 상태 업데이트
			useShiftStore.getState().setDutyInfo(data);

			// onUpdate 함수 호출하여 화면 갱신
			await onUpdate(year, month);
		} catch (error) {
			// 실패 알림
			toast.error("초기화에 실패하였습니다.", {
				position: "top-center",
				autoClose: 2000,
			});
		}
	};

	const navigate = useNavigate();
	const handleAutoCreate = async () => {
		if (isAutoCreating) {
			toast.warning("이미 자동생성 중입니다.", {
				position: "top-center",
				autoClose: 2000,
			});
			return;
		}

		setIsAutoGenerateModalOpen(true);
	};

	const handleAutoGenerateConfirm = async () => {
		setIsAutoGenerateModalOpen(false);
		try {
			setIsAutoCreating(true);
			// 자동생성 중임을 알림
			const loadingToast = toast.loading("근무표에 마침표를 찍고 있습니다...", {
				position: "top-center",
			});

			// API 호출
			await dutyService.autoCreateDuty(year, month);

			// 화면 갱신
			await onUpdate(year, month);

			// 성공 알림
			toast.update(loadingToast, {
				render: "자동생성에 성공했습니다",
				type: "success",
				isLoading: false,
				autoClose: 2000,
				position: "top-center",
			});
		} catch (error: any) {
			// 로딩 토스트 제거
			toast.dismiss();

			if (error.response) {
				switch (error.response.status) {
					case 401:
						toast.error("로그인이 필요합니다.", {
							position: "top-center",
							autoClose: 2000,
						});
						window.location.href = "/login";
						break;
					case 400:
						toast.error("근무 일정을 찾을 수 없습니다.", {
							position: "top-center",
							autoClose: 2000,
						});
						break;
					case 406:
						// 모든 토스트 메시지 제거
						const neededNurseCount = error.response.data.neededNurseCount;
						setNeededNurseCount(neededNurseCount);
						setIsNurseCountModalOpen(true);
						break;
					case 405:
						toast.info("모든 조건을 만족하는 최적의 근무표입니다.", {
							position: "top-center",
							autoClose: 2000,
						});
						break;
					default:
						toast.error("자동생성에 실패했습니다", {
							position: "top-center",
							autoClose: 2000,
						});
				}
			} else {
				toast.error("자동생성에 실패했습니다", {
					position: "top-center",
					autoClose: 2000,
				});
			}
		} finally {
			setIsAutoCreating(false);
		}
	};

	// 근무표 다운로드 기능
	const handleDownloadWardSchedule = async () => {
		const tableElement = document.querySelector(".duty-table-content");
		if (!tableElement) return;

		const tempSelectedCell = selectedCell;
		setSelectedCell(null);

		const tempRequests = requests;
		setRequests([]);

		try {
			const dataUrl = await toPng(tableElement as HTMLElement, {
				quality: 1.0,
				pixelRatio: 2,
				width: tableElement.scrollWidth + 14.5, // 여백 추가
				height: tableElement.scrollHeight + 5, // 여백 추가
				backgroundColor: "#FFFFFF",
				style: {
					borderCollapse: "collapse",
				},
			});

			const link = document.createElement("a");
			link.download = `듀티표_${year}년_${month}월.png`;
			link.href = dataUrl;
			link.click();

			toast.success("듀티표가 다운로드되었습니다.", {
				position: "top-center",
				autoClose: 2000,
			});
		} catch (error) {
			console.error("Download error:", error);
			toast.error("듀티표 다운로드에 실패했습니다.", {
				position: "top-center",
				autoClose: 2000,
			});
		}
		setSelectedCell(tempSelectedCell);
		setRequests(tempRequests);
	};

	// URL 쿼리 파라미터로부터 초기 데이터 로드
	useEffect(() => {
		const url = new URL(window.location.href);
		const urlYear = url.searchParams.get("year");
		const urlMonth = url.searchParams.get("month");

		// URL에 year, month가 없을 때만 현재 값으로 설정
		if (!urlYear || !urlMonth) {
			url.searchParams.set("year", year.toString());
			url.searchParams.set("month", month.toString());
			window.history.replaceState({}, "", url.toString());
		}
	}, []); // 컴포넌트 마운트 시 한 번만 실행

	const [requests, setRequests] = useState<WardRequest[]>([]);

	useEffect(() => {
		checkIsWeb();

		const fetchRequests = async () => {
			try {
				const data = await requestService.getWardRequests();
				setRequests(data);
			} catch (error) {
				console.error("Failed to fetch requests:", error);
			}
		};

		fetchRequests();

		window.addEventListener("resize", checkIsWeb);
	}, []);

	const checkIsWeb = () => {
		setIsWeb(window.innerWidth >= 1280);
	};

	const [isNurseCountModalOpen, setIsNurseCountModalOpen] = useState(false);
	const [neededNurseCount, setNeededNurseCount] = useState(0);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isWeb, setIsWeb] = useState(false);

	// 엑셀 다운로드 함수
	const handleExportToExcel = () => {
		// 데이터 변환: 테이블 데이터를 배열 형태로 정리
		const tableData = [];

		// 첫 번째 행: 컬럼 제목 추가
		const headerRow = [
			"이름",
			"이전 근무",
			...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`),
			"D",
			"E",
			"N",
			"O",
		];
		tableData.push(headerRow);

		// 데이터 행 추가
		dutyData.forEach((nurse, i) => {
			const rowData = [
				nurse.name, // 간호사 이름
				nurse.prevShifts, // 이전 근무
				...duties[i], // 근무 정보
				nurseDutyCounts[i]?.D || 0,
				nurseDutyCounts[i]?.E || 0,
				nurseDutyCounts[i]?.N || 0,
				nurseDutyCounts[i]?.O || 0,
			];
			tableData.push(rowData);
		});

		// 워크북 생성 및 시트 추가
		const ws = XLSX.utils.aoa_to_sheet(tableData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "근무표");

		// 엑셀 파일 저장 및 다운로드
		XLSX.writeFile(wb, `근무표_${year}년_${month}월.xlsx`);
	};
	// const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
	const [showWebDownloadDropdown, setShowWebDownloadDropdown] = useState(false);

	const [wardRules, setWardRules] = useState<WardRule | null>(null);

	useEffect(() => {
		const fetchShiftRules = async () => {
			try {
				const rules = await ruleService.getWardRules();
				setWardRules(rules);
			} catch (error) {
				console.error("Failed to fetch ward rules:", error);
			}
		};
		fetchShiftRules();
	}, []);

	const getCountColor = (
		count: number,
		day: number,
		shiftType: "D" | "E" | "N",
	) => {
		if (!wardRules) return "";

		const isWeekendDay = isHoliday(year, month, day);
		const targetCount = isWeekendDay
			? {
					D: wardRules.wendDCnt,
					E: wardRules.wendECnt,
					N: wardRules.wendNCnt,
				}[shiftType]
			: {
					D: wardRules.wdayDCnt,
					E: wardRules.wdayECnt,
					N: wardRules.wdayNCnt,
				}[shiftType];

		if (count === targetCount) return "text-green-600 font-medium";
		return "text-red-600 font-medium";
	};

	return (
		<div>
			{/* 모바일 뷰 */}
			<div className="xl:hidden">
				{/* 상단 컨트롤 영역 */}
				<div className="bg-white rounded-xl py-2 px-3 mb-2 flex items-center justify-between">
					{/* 왼쪽: 월 선택 및 기본 OFF */}
					<div className="flex items-center gap-2">
						<Icon
							name="left"
							size={16}
							className="cursor-pointer text-gray-600"
							onClick={handlePrevMonth}
						/>
						<span className="text-base font-medium">{month}월</span>
						<Icon
							name="right"
							size={16}
							className="cursor-pointer text-gray-600"
							onClick={handleNextMonth}
						/>
						<div className="flex items-center gap-1 ml-2 text-xs">
							<span className="text-gray-400">기본 OFF</span>
							<span className="font-bold text-black">
								{getDefaultOffDays(year, month)}
							</span>
							<span>일</span>
						</div>
					</div>

					{/* 오른쪽: 드롭다운 메뉴 */}
					<div className="relative">
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="p-2 hover:bg-gray-100 rounded-full"
						>
							<Icon name="more" size={20} className="text-gray-600" />
						</button>

						{/* 드롭다운 메뉴와 오버레이 */}
						{isDropdownOpen && (
							<>
								{/* 오버레이 - 외부 클릭 시 닫힘 */}
								<div
									className="fixed inset-0 z-40"
									onClick={() => setIsDropdownOpen(false)}
								/>

								{/* 드롭다운 메뉴 */}
								<div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
									<button
										onClick={() => {
											setIsDropdownOpen(false);
											handleResetDuty();
										}}
										className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
									>
										<Icon name="reset" size={16} />
										<span>초기화</span>
									</button>
									<button
										ref={ruleButtonRef}
										onClick={() => {
											setIsDropdownOpen(false);
											setIsRuleModalOpen(true);
										}}
										className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
									>
										<Icon name="rule" size={16} />
										<span>규칙 설정</span>
									</button>
									<button
										onClick={() => {
											setIsDropdownOpen(false);
											handleAutoCreate();
										}}
										className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
									>
										<Icon name="auto" size={16} />
										<span>자동 생성</span>
									</button>
									<button
										onClick={() => {
											setIsDropdownOpen(false);
											handleDownloadWardSchedule();
										}}
										className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
									>
										<span>이미지 다운로드</span>
									</button>
									<button
										onClick={() => {
											setIsDropdownOpen(false);
											handleExportToExcel();
										}}
										className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
									>
										<span>엑셀로 다운로드</span>
									</button>
								</div>
							</>
						)}
					</div>
				</div>

				{/* 기존 테이블 영역 */}
				<div className="overflow-x-auto bg-white rounded-xl p-[0.5rem] shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
					<div className={`min-w-[800px] ${isWeb ? "" : "duty-table-content"}`}>
						{/* 기존 테이블 내용을 여기에 복사 */}
						<table className="w-full border-collapse">
							{/* 기존 테이블 헤더와 내용 */}
							<thead>
								<tr className="text-xs text-gray-600 border-b border-gray-200">
									<th className="p-0 text-center w-[90px] sm:w-24 border-r border-gray-200">
										<span className="block text-xs sm:text-sm px-0.5">
											이름
										</span>
									</th>
									<th className="p-0 text-center w-[90px] sm:w-24 border-r border-gray-200">
										<span className="block text-xs sm:text-sm px-0.5">
											이전 근무
										</span>
									</th>
									{Array.from({ length: daysInMonth }, (_, i) => {
										const day = i + 1;
										return (
											<th
												key={i}
												className={`p-0 text-center w-10 border-r border-gray-200 ${
													isHolidayDay(day) ? "text-red-500" : ""
												}`}
											>
												{day}
											</th>
										);
									})}
									<th className="p-0 text-center w-7 border-r border-gray-200">
										<div className="flex items-center justify-center">
											<div className="scale-[0.65]">
												<DutyBadgeEng type="D" size="sm" variant="filled" />
											</div>
										</div>
									</th>
									<th className="p-0 text-center w-7 border-r border-gray-200">
										<div className="flex items-center justify-center">
											<div className="scale-[0.65]">
												<DutyBadgeEng type="E" size="sm" variant="filled" />
											</div>
										</div>
									</th>
									<th className="p-0 text-center w-7 border-r border-gray-200">
										<div className="flex items-center justify-center">
											<div className="scale-[0.65]">
												<DutyBadgeEng type="N" size="sm" variant="filled" />
											</div>
										</div>
									</th>
									<th className="p-0 text-center w-7 border-r border-gray-200">
										<div className="flex items-center justify-center">
											<div className="scale-[0.65]">
												<DutyBadgeEng type="O" size="sm" variant="filled" />
											</div>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{nurses.map((name, i) => (
									<tr key={i} className="h-8 border-b border-gray-200 group">
										<td
											className={`p-0 text-center border-r border-gray-200 ${isHighlighted(i, -2)}`}
										>
											<span className="block text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
												{name}
											</span>
										</td>
										<td
											className={`p-0 border-r border-gray-200 ${isHighlighted(i, -1)}`}
										>
											<div className="flex justify-center -space-x-1.5">
												{prevShifts[i].map((shift, index) => (
													<div key={index} className="scale-[0.65]">
														<DutyBadgeEng
															type={
																shift as "X" | "D" | "E" | "N" | "O" | "ALL"
															}
															size="sm"
															isSelected={false}
														/>
													</div>
												))}
											</div>
										</td>
										{Array.from({ length: daysInMonth }, (_, dayIndex) => {
											if (!duties[i] || !duties[i][dayIndex]) return null;

											const violations = issues.filter(
												(issue) =>
													issue.memberId === dutyData[i].memberId &&
													dayIndex + 1 >= issue.startDate &&
													dayIndex + 1 <= issue.endDate,
											);

											const requestStatus = requests.find((request) => {
												const requestDate = new Date(request.date);
												return (
													requestDate.getFullYear() === year &&
													requestDate.getMonth() + 1 === month &&
													requestDate.getDate() === dayIndex + 1 &&
													request.name === nurses[i]
												);
											});

											return (
												<DutyCell
													key={dayIndex}
													nurse={name}
													dayIndex={dayIndex}
													duty={duties[i][dayIndex] || "X"}
													isSelected={
														selectedCell?.row === i &&
														selectedCell?.col === dayIndex
													}
													violations={violations}
													requestStatus={requestStatus}
													isHovered={
														hoveredCell?.row === i &&
														hoveredCell?.day === dayIndex
													}
													onClick={() => handleCellClick(i, dayIndex)}
													onMouseEnter={() =>
														setHoveredCell({ row: i, day: dayIndex })
													}
													onMouseLeave={() => setHoveredCell(null)}
													highlightClass={isHighlighted(i, dayIndex)}
												/>
											);
										})}
										<td
											className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 31)}`}
										>
											{nurseDutyCounts[i]?.D || 0}
										</td>
										<td
											className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 32)}`}
										>
											{nurseDutyCounts[i]?.E || 0}
										</td>
										<td
											className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 33)}`}
										>
											{nurseDutyCounts[i]?.N || 0}
										</td>
										<td
											className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 34)}`}
										>
											{nurseDutyCounts[i]?.O || 0}
										</td>
									</tr>
								))}
							</tbody>
							{/* 통계 행들을 같은 테이블에 직접 추가 */}
							<tbody>
								{["DAY", "EVENING", "NIGHT", "OFF", "TOTAL"].map((text, i) => (
									<tr
										key={`empty-${i}`}
										className="text-[10px] h-6 border-b border-gray-200"
									>
										<td
											colSpan={2}
											className={`p-0 font-bold text-[11px] border-r border-gray-200 ${
												i === 0
													? "text-[#318F3D]"
													: i === 1
														? "text-[#E55656]"
														: i === 2
															? "text-[#532FC8]"
															: i === 3
																? "text-[#726F5A]"
																: "text-black"
											}`}
										>
											<div className="flex items-center justify-center">
												{text}
											</div>
										</td>
										{Array.from({ length: daysInMonth }, (_, j) => (
											<td
												key={j}
												className={`p-0 text-center text-[11px] border-r border-gray-200 ${
													selectedCell?.col === j ? "bg-duty-off-bg" : ""
												}`}
											>
												<div className="flex items-center justify-center h-6">
													{i === 0 && (
														<span
															className={getCountColor(
																dutyCounts[j].D,
																j + 1,
																"D",
															)}
														>
															{dutyCounts[j].D}
														</span>
													)}
													{i === 1 && (
														<span
															className={getCountColor(
																dutyCounts[j].E,
																j + 1,
																"E",
															)}
														>
															{dutyCounts[j].E}
														</span>
													)}
													{i === 2 && (
														<span
															className={getCountColor(
																dutyCounts[j].N,
																j + 1,
																"N",
															)}
														>
															{dutyCounts[j].N}
														</span>
													)}
													{i === 3 && dutyCounts[j].O}
													{i === 4 && dutyCounts[j].total}
												</div>
											</td>
										))}
										{/* 각 행의 마지막 4개 열을 차지하는 셀 */}
										{i === 0 && (
											<td
												rowSpan={5}
												colSpan={4}
												className="p-0 border-r border-gray-200"
											>
												<div className="flex justify-center items-center h-full">
													<div className="scale-[0.85]">
														<ProgressChecker
															value={progress}
															size={80}
															strokeWidth={4}
															showLabel={true}
														/>
													</div>
												</div>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* 웹 뷰 */}
			<div className="hidden xl:block">
				<div
					className="bg-white rounded-[0.92375rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] p-[1.5rem]"
					ref={tableRef}
				>
					{/* 월 선택 및 버튼 영역 */}
					<div className="bg-white rounded-xl py-[0.5rem] px-[0.5rem] mb-[0.1875rem]">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<div className="flex ml-[0.75rem] items-center gap-[0.75rem]">
									<Icon
										name="left"
										size={16}
										className="cursor-pointer text-gray-600 hover:text-gray-800"
										onClick={handlePrevMonth}
									/>
									<span className="text-lg font-medium">{month}월</span>
									<Icon
										name="right"
										size={16}
										className="cursor-pointer text-gray-600 hover:text-gray-800"
										onClick={handleNextMonth}
									/>
									<div className="flex items-center gap-2 ml-1">
										<span className="text-[11px] sm:text-xs text-gray-400">
											기본 OFF
										</span>
										<span className="text-[12px] sm:text-sm font-bold text-black">
											{getDefaultOffDays(year, month)}
										</span>
										<span className="text-foreground">일</span>
									</div>
									<div>
										<button
											className={`flex items-center gap-1 text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md ${
												isAllCellsEmpty
													? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
													: "hover:bg-gray-100"
											}`}
											onClick={handleResetDuty}
										>
											<Icon name="reset" size={16} />
											<span className="text-sm whitespace-nowrap">초기화</span>
										</button>
									</div>
								</div>
							</div>
							{/* 버튼 영역 */}
							<div className="flex gap-1 sm:gap-2 items-center">
								<div className="flex items-center gap-2 relative group">
									<Button
										text-size="md"
										size="register"
										color="off"
										className="py-0.5 px-1.5 sm:py-1 sm:px-2"
									>
										<div className="flex items-center gap-1 relative group">
											<span>키보드 가이드</span>
										</div>
									</Button>

									{/* 호버 시 나타나는 가이드 */}
									<div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 top-full left-0 mt-2">
										<KeyboardGuide />
									</div>
								</div>
								<div className="h-6 w-[1px] bg-gray-200 mx-1" />
								<Button
									ref={ruleButtonRef}
									size="register"
									color="primary"
									className="py-0.5 px-1.5 sm:py-1 sm:px-2"
									onClick={() => setIsRuleModalOpen(true)}
								>
									규칙 설정
								</Button>
								<div className="flex items-center gap-1">
									<Button
										text-size="md"
										size="register"
										color="evening"
										className="py-0.5 px-1.5 sm:py-1 sm:px-2 flex items-center gap-2 group"
										onClick={handleAutoCreate}
									>
										자동 생성
										<Tooltip
											content={
												<div className="text-left space-y-1.5">
													<p>
														근무표는 다음 조건들을 고려하여 자동으로 생성됩니다:
													</p>
													<ul className="list-disc pl-4 space-y-1">
														<li>주중/주말별 필요 최소 인원</li>
														<li>근무표 규칙</li>
														<li>개인별 근무 요청</li>
														<li>평일 데이, 나이트 전담 근무</li>
														<li>간호사 간 균등한 근무 배분</li>
														<li>지난 달 말일 근무 고려</li>
													</ul>
													<p className="mt-2 text-gray-300">
														*숙련도 반영은은 개발 중입니다.
														<br />* 커스텀 규칙 생성 기능은 개발 중입니다.
														<br />
														*완성도 100%일 시 새로운 근무표가 생성되지 않을 수
														있습니다.
														<br />
														*변경이 필요한 칸을 X로 눌러 자동생성을 재실행하는
														것을 추천드립니다.
													</p>
												</div>
											}
											className="ml-1"
											width="w-96"
											icon={{
												name: "alert",
												size: 16,
												className:
													"text-duty-evening group-hover:text-white transition-colors cursor-help",
											}}
										/>
									</Button>
								</div>
								<div className="relative">
									<Button
										text-size="md"
										size="register"
										color="off"
										className="py-0.5 px-1.5 sm:py-1 sm:px-2"
										onClick={() => setShowWebDownloadDropdown((prev) => !prev)}
									>
										다운로드
									</Button>
									{showWebDownloadDropdown && (
										<div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
											<button
												onClick={() => {
													setShowWebDownloadDropdown(false);
													handleDownloadWardSchedule();
												}}
												className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
											>
												이미지로 다운로드
											</button>
											<button
												onClick={() => {
													setShowWebDownloadDropdown(false);
													handleExportToExcel(); // 엑셀 다운로드 함수 추가 필요
												}}
												className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
											>
												엑셀로 다운로드
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* 근무표, 통계, 완성도를 하나의 상자로 통합 */}
					<div className="bg-white rounded-xl p-[0.5rem] shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
						{isLoading ? (
							<div className="flex justify-center items-center h-[25rem]">
								<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
							</div>
						) : (
							<div className="relative">
								<div className="overflow-x-auto">
									<div
										className={`min-w-[50rem] ${isWeb ? "duty-table-content" : ""}`}
									>
										<table className="relative w-full border-collapse z-10">
											<thead>
												<tr className="text-xs text-gray-600 border-b border-gray-200">
													<th className="p-0 text-center w-[90px] sm:w-24 border-r border-gray-200">
														<span className="block text-xs sm:text-sm px-0.5">
															이름
														</span>
													</th>
													<th className="p-0 text-center w-[90px] sm:w-24 border-r border-gray-200">
														<span className="block text-xs sm:text-sm px-0.5">
															이전 근무
														</span>
													</th>

													{Array.from({ length: daysInMonth }, (_, i) => {
														const day = i + 1;
														return (
															<th
																key={i}
																className={`p-0 text-center w-10 border-r border-gray-200 ${
																	isHoliday(year, month, day)
																		? "text-red-500"
																		: ""
																}`}
															>
																{day}
															</th>
														);
													})}
													<th className="p-0 text-center w-7 border-r border-gray-200">
														<div className="flex items-center justify-center">
															<div className="scale-[0.65]">
																<DutyBadgeEng
																	type="D"
																	size="sm"
																	variant="filled"
																/>
															</div>
														</div>
													</th>
													<th className="p-0 text-center w-7 border-r border-gray-200">
														<div className="flex items-center justify-center">
															<div className="scale-[0.65]">
																<DutyBadgeEng
																	type="E"
																	size="sm"
																	variant="filled"
																/>
															</div>
														</div>
													</th>
													<th className="p-0 text-center w-7 border-r border-gray-200">
														<div className="flex items-center justify-center">
															<div className="scale-[0.65]">
																<DutyBadgeEng
																	type="N"
																	size="sm"
																	variant="filled"
																/>
															</div>
														</div>
													</th>
													<th className="p-0 text-center w-7 border-r border-gray-200">
														<div className="flex items-center justify-center">
															<div className="scale-[0.65]">
																<DutyBadgeEng
																	type="O"
																	size="sm"
																	variant="filled"
																/>
															</div>
														</div>
													</th>
												</tr>
											</thead>
											<tbody>
												{nurses.map((name, i) => (
													<tr
														key={i}
														className="h-8 border-b border-gray-200 group"
													>
														<td
															className={`p-0 text-center border-r border-gray-200 ${isHighlighted(i, -2)}`}
														>
															<span className="block text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
																{name}
															</span>
														</td>
														<td
															className={`p-0 border-r border-gray-200 ${isHighlighted(i, -1)}`}
														>
															<div className="flex justify-center -space-x-1.5">
																{prevShifts[i].map((shift, index) => (
																	<div key={index} className="scale-[0.65]">
																		<DutyBadgeEng
																			type={
																				shift as
																					| "X"
																					| "D"
																					| "E"
																					| "N"
																					| "O"
																					| "ALL"
																			}
																			size="sm"
																			isSelected={false}
																		/>
																	</div>
																))}
															</div>
														</td>
														{Array.from(
															{ length: daysInMonth },
															(_, dayIndex) => {
																if (!duties[i] || !duties[i][dayIndex])
																	return null;

																const violations = issues.filter(
																	(issue) =>
																		issue.memberId === dutyData[i].memberId &&
																		dayIndex + 1 >= issue.startDate &&
																		dayIndex + 1 <= issue.endDate,
																);

																const requestStatus = requests.find(
																	(request) => {
																		const requestDate = new Date(request.date);
																		return (
																			requestDate.getFullYear() === year &&
																			requestDate.getMonth() + 1 === month &&
																			requestDate.getDate() === dayIndex + 1 &&
																			request.name === nurses[i]
																		);
																	},
																);

																return (
																	<DutyCell
																		key={dayIndex}
																		nurse={name}
																		dayIndex={dayIndex}
																		duty={duties[i][dayIndex] || "X"}
																		isSelected={
																			selectedCell?.row === i &&
																			selectedCell?.col === dayIndex
																		}
																		violations={violations}
																		requestStatus={requestStatus}
																		isHovered={
																			hoveredCell?.row === i &&
																			hoveredCell?.day === dayIndex
																		}
																		onClick={() => handleCellClick(i, dayIndex)}
																		onMouseEnter={() =>
																			setHoveredCell({ row: i, day: dayIndex })
																		}
																		onMouseLeave={() => setHoveredCell(null)}
																		highlightClass={isHighlighted(i, dayIndex)}
																	/>
																);
															},
														)}
														<td
															className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 31)}`}
														>
															{nurseDutyCounts[i]?.D || 0}
														</td>
														<td
															className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 32)}`}
														>
															{nurseDutyCounts[i]?.E || 0}
														</td>
														<td
															className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 33)}`}
														>
															{nurseDutyCounts[i]?.N || 0}
														</td>
														<td
															className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(i, 34)}`}
														>
															{nurseDutyCounts[i]?.O || 0}
														</td>
													</tr>
												))}
											</tbody>
											{/* 통계 행들을 같은 테이블에 직접 추가 */}
											<tbody>
												{["DAY", "EVENING", "NIGHT", "OFF", "TOTAL"].map(
													(text, i) => (
														<tr
															key={`empty-${i}`}
															className="text-[10px] h-6 border-b border-gray-200"
														>
															<td
																colSpan={2}
																className={`p-0 font-bold text-[11px] border-r border-gray-200 ${
																	i === 0
																		? "text-[#318F3D]"
																		: i === 1
																			? "text-[#E55656]"
																			: i === 2
																				? "text-[#532FC8]"
																				: i === 3
																					? "text-[#726F5A]"
																					: "text-black"
																}`}
															>
																<div className="flex items-center justify-center">
																	{text}
																</div>
															</td>
															{Array.from({ length: daysInMonth }, (_, j) => (
																<td
																	key={j}
																	className={`p-0 text-center text-[11px] border-r border-gray-200 ${
																		selectedCell?.col === j
																			? "bg-duty-off-bg"
																			: ""
																	}`}
																>
																	<div className="flex items-center justify-center h-6">
																		{i === 0 && (
																			<span
																				className={getCountColor(
																					dutyCounts[j].D,
																					j + 1,
																					"D",
																				)}
																			>
																				{dutyCounts[j].D}
																			</span>
																		)}
																		{i === 1 && (
																			<span
																				className={getCountColor(
																					dutyCounts[j].E,
																					j + 1,
																					"E",
																				)}
																			>
																				{dutyCounts[j].E}
																			</span>
																		)}
																		{i === 2 && (
																			<span
																				className={getCountColor(
																					dutyCounts[j].N,
																					j + 1,
																					"N",
																				)}
																			>
																				{dutyCounts[j].N}
																			</span>
																		)}
																		{i === 3 && dutyCounts[j].O}
																		{i === 4 && dutyCounts[j].total}
																	</div>
																</td>
															))}
															{/* 각 행의 마지막 4개 열을 차지하는 셀 */}
															{i === 0 && (
																<td
																	rowSpan={5}
																	colSpan={4}
																	className="p-0 border-r border-gray-200"
																>
																	<div className="flex justify-center items-center h-full">
																		<div className="scale-[0.85]">
																			<ProgressChecker
																				value={progress}
																				size={80}
																				strokeWidth={4}
																				showLabel={true}
																			/>
																		</div>
																	</div>
																</td>
															)}
														</tr>
													),
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 공통 모달 영역 - 뷰포트 외부에 배치 */}
			{isRuleModalOpen && (
				<RuleEditModal
					onClose={() => setIsRuleModalOpen(false)}
					buttonRef={ruleButtonRef}
					onRuleUpdate={(newRules) => setWardRules(newRules)}
				/>
			)}
			<NurseCountModal
				isOpen={isNurseCountModalOpen}
				onClose={() => setIsNurseCountModalOpen(false)}
				onConfirm={() => {
					setIsNurseCountModalOpen(false);
					navigate("/ward-admin");
				}}
				neededNurseCount={neededNurseCount}
			/>

			<AutoGenerateConfirmModal
				isOpen={isAutoGenerateModalOpen}
				onClose={() => setIsAutoGenerateModalOpen(false)}
				onConfirm={handleAutoGenerateConfirm}
				onModify={() => {
					setIsAutoGenerateModalOpen(false);
					setIsRuleModalOpen(true);
				}}
				wardRules={wardRules}
			/>
		</div>
	);
};

export default memo(ShiftAdminTable);
