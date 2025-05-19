import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { MdDragIndicator } from 'react-icons/md';

import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import FaultLayer from '@/components/atoms/FaultLayer';
import { ProgressChecker } from '@/components/atoms/ProgressChecker';
import RequestStatusLayer from '@/components/atoms/RequestStatusLayer';
import AutoGenCountModal from '@/components/organisms/AutoGenCountModal';
import AutoGenerateConfirmModal from '@/components/organisms/AutoGenerateConfirmModal';
import DemoSignupModal from '@/components/organisms/DemoSignupModal';
import NurseCountModal from '@/components/organisms/NurseCountModal';
import PaymentModal from '@/components/organisms/PaymentModal';
import ResetDutyConfirmModal from '@/components/organisms/ResetDutyConfirmModal';
import RuleEditModal from '@/components/organisms/RuleEditModal';
import SubscriptionSuccessModal from '@/components/organisms/SubscriptionSuccessModal';
import NurseShortageModal from '@/components/organisms/NurseShortageModal';
import MobileDutyControls from '@/components/molecules/MobileDutyControls';
import RequestCheckModal from '@/components/organisms/RequestCheckModal';
import UnreflectedRequestsModal from '@/components/organisms/UnreflectedRequestsModal';
import NurseShortageAlert from '@/components/molecules/NurseShortageAlert';
import useNurseShortageCalculation from '@/hooks/useNurseShortageCalculation';

import {
  dutyService,
  SubscriptionPlan,
  UnreflectedRequest,
} from '@/services/dutyService';
import { requestService, WardRequest } from '@/services/requestService';
import { ruleService, WardRule } from '@/services/ruleService.ts';

import useShiftStore from '@/stores/shiftStore';
import useUserAuthStore from '@/stores/userAuthStore';
import { useHolidayStore } from '@/stores/holidayStore';
import { useRequestCountStore } from '@/stores/requestCountStore';
import { useApplyAcceptedRequestsDemoOnly } from '@/hooks/useApplyAcceptedRequestsDemoOnly';
import useWardStore from '@/stores/wardStore';

import {
  getMaxAllowedMonth,
  isSaturday,
  isSunday,
  isHoliday,
} from '@/utils/dateUtils';

// useShiftExport 훅 추가
import { useShiftExport } from '@/hooks/useShiftExport';

// ShiftTableControls 컴포넌트 추가
import {
  MobileShiftControls,
  DesktopShiftControls,
} from '@/components/molecules/ShiftTableControls';

// 근무표 관리자 테이블의 props 인터페이스
interface ShiftAdminTableProps {
  dutyData: {
    // 간호사별 근무 데이터
    memberId: number;
    name: string;
    role: 'HN' | 'RN';
    prevShifts: string; // 이전 달 마지막 주 근무
    shifts: string; // 현재 달 근무
    isSynced?: boolean; // 추가된 속성
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
type DutyType = 'D' | 'E' | 'N' | 'O' | 'X' | 'ALL' | 'M';
// 유효한 근무 타입 (X와 ALL 제외)
type ValidDutyType = Exclude<DutyType, 'X' | 'ALL'>;
// 근무 타입별 카운트 인터페이스
type DutyCounts = {
  [key in ValidDutyType]: number;
} & { total?: number };

// 유효한 근무 타입인지 확인하는 타입 가드 함수
const isValidDuty = (duty: string): duty is ValidDutyType => {
  return (
    duty === 'D' || duty === 'E' || duty === 'N' || duty === 'O' || duty === 'M'
  );
};

const loadingMessages = [
  '근무표에 마침표를 찍고 있습니다...',
  '간호사 요청을 반영하고 있습니다...',
  '규칙을 적용하고 있습니다...',
  '금지 패턴을 확인하고 있습니다...',
  '연속 근무를 최적화하고 있습니다...',
  '근무표의 균형을 맞추고 있습니다...',
  '최종 점검을 진행하고 있습니다...',
];

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
  isDimmed?: boolean;
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
    isDimmed,
  }: CellProps) => {
    // 규칙 위반이 시작되는 날짜인지 확인
    const isAnyViolationStart = violations.some(
      (v) => dayIndex + 1 === v.startDate
    );

    return (
      <td
        onClick={onClick}
        className={`p-0 text-center border-r border-gray-200 relative ${highlightClass} ${isDimmed ? 'opacity-40' : ''}`}
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
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isAnyViolationStart && (
            <FaultLayer
              key={`violations-${dayIndex + 1}`}
              startDate={dayIndex + 1}
              endDate={Math.max(
                ...violations
                  .filter((v) => v.startDate === dayIndex + 1)
                  .map((v) => v.endDate)
              )}
              messages={violations
                .filter((v) => v.startDate === dayIndex + 1)
                .map((v) => v.message)}
              total={violations.length}
              className={isHovered ? 'opacity-90' : ''}
            />
          )}
          {requestStatus && (
            <RequestStatusLayer
              date={dayIndex + 1}
              status={requestStatus.status}
              message={requestStatus.memo}
              className={isHovered ? 'opacity-90' : ''}
            />
          )}
          <div className="relative z-[2]">
            <div className="scale-[0.9]">
              <DutyBadgeEng
                type={duty as 'D' | 'E' | 'N' | 'O' | 'X' | 'M'}
                size="sm"
                isSelected={isSelected}
              />
            </div>
          </div>
        </div>
      </td>
    );
  }
);

DutyCell.displayName = 'DutyCell';

// 드래그 가능한 간호사 행 컴포넌트 추가
interface SortableNurseRowProps {
  index: number;
  nurse: {
    memberId: number;
    name: string;
    role: 'HN' | 'RN';
    prevShifts: string;
    shifts: string;
    isSynced?: boolean;
  };
  duties: string[];
  prevShifts: string[][]; // 타입 수정: 각 간호사별 이전 근무 배열의 배열
  selectedCell: { row: number; col: number } | null;
  hoveredCell: { row: number; day: number } | null;
  issues: any[];
  wardRequests: WardRequest[];
  daysInMonth: number;
  isResetting: boolean;
  nurseDutyCounts: {
    D?: number;
    E?: number;
    N?: number;
    O?: number;
    M?: number;
  }; // 타입 수정: 근무 유형별 카운트 객체
  handleCellClick: (row: number, col: number) => void;
  setHoveredCell: (cell: { row: number; day: number } | null) => void;
  isHighlighted: (row: number, col: number) => string;
}

const SortableNurseRow = memo(
  ({
    index,
    nurse,
    duties,
    prevShifts,
    selectedCell,
    hoveredCell,
    issues,
    wardRequests,
    daysInMonth,
    isResetting,
    nurseDutyCounts,
    handleCellClick,
    setHoveredCell,
    isHighlighted,
  }: SortableNurseRowProps) => {
    // useSortable 훅 사용하여 드래그 가능하게 설정
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: nurse.memberId.toString(),
      data: {
        nurse,
        index,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 999 : 'auto',
      position: 'relative' as const,
      touchAction: 'pan-x', // 수평 스크롤 허용, 수직 드래그만 컴포넌트가 처리
    };

    // 간호사 이름 컬럼 렌더링
    const nameColumn = (
      <td
        className={`p-0 text-center border-r border-gray-200 relative ${isHighlighted(index, -2)}`}
      >
        <div className="flex items-center justify-between px-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab pr-2"
            style={{ touchAction: 'pan-x' }}
          >
            <MdDragIndicator size={20} />
          </div>
          <span className="block text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {nurse.name}
          </span>
        </div>
      </td>
    );

    // 이전 근무 컬럼 렌더링
    const prevShiftsColumn = (
      <td
        className={`p-0 border-r border-gray-200 ${isHighlighted(index, -1)}`}
      >
        <div className="flex justify-center -space-x-1.5">
          {prevShifts[index]?.map((shift: string, idx: number) => (
            <div key={idx} className="scale-[0.65]">
              <DutyBadgeEng
                type={shift as 'X' | 'D' | 'E' | 'N' | 'O' | 'ALL' | 'M'}
                size="sm"
                isSelected={false}
              />
            </div>
          ))}
        </div>
      </td>
    );

    // 근무 일자별 셀 렌더링
    const dutyCells = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      if (!duties[dayIndex]) return null;

      const violations = issues.filter(
        (issue) =>
          issue.memberId === nurse.memberId &&
          dayIndex + 1 >= issue.startDate &&
          dayIndex + 1 <= issue.endDate
      );

      const requestStatus = wardRequests.find((request) => {
        const requestDate = new Date(request.date);
        return (
          requestDate.getDate() === dayIndex + 1 && request.name === nurse.name
        );
      });

      return (
        <DutyCell
          key={dayIndex}
          nurse={nurse.name}
          dayIndex={dayIndex}
          duty={duties[dayIndex] || 'X'}
          isSelected={
            selectedCell?.row === index && selectedCell?.col === dayIndex
          }
          isDimmed={isResetting}
          violations={violations}
          requestStatus={requestStatus}
          isHovered={
            hoveredCell?.row === index && hoveredCell?.day === dayIndex
          }
          onClick={() => handleCellClick(index, dayIndex)}
          onMouseEnter={() => setHoveredCell({ row: index, day: dayIndex })}
          onMouseLeave={() => setHoveredCell(null)}
          highlightClass={isHighlighted(index, dayIndex)}
        />
      );
    });

    // 근무 통계 셀 렌더링
    const statCells = (
      <>
        <td
          className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(index, 31)}`}
        >
          {nurseDutyCounts.D || 0}
        </td>
        <td
          className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(index, 32)}`}
        >
          {nurseDutyCounts.E || 0}
        </td>
        <td
          className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(index, 33)}`}
        >
          {nurseDutyCounts.N || 0}
        </td>
        <td
          className={`p-0 text-xs text-center border-r border-gray-200 ${isHighlighted(index, 34)}`}
        >
          {nurseDutyCounts.O || 0}
        </td>
      </>
    );

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={`h-8 border-b border-gray-200 group ${isDragging ? 'bg-gray-50' : ''}`}
      >
        {nameColumn}
        {prevShiftsColumn}
        {dutyCells}
        {statCells}
      </tr>
    );
  }
);

SortableNurseRow.displayName = 'SortableNurseRow';

const SpinnerOverlay = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-30">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

const ShiftAdminTable = memo(
  ({
    dutyData = [],
    year,
    month,
    onUpdate,
    issues = [],
  }: ShiftAdminTableProps) => {
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] =
      useState(false);
    const [isLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isWeb, setIsWeb] = useState(false);
    const [wardRules, setWardRules] = useState<WardRule | null>(null);
    const [isFromAutoGenerate, setIsFromAutoGenerate] = useState(false);
    const [isRequestCheckModalOpen, setIsRequestCheckModalOpen] =
      useState(false);
    const [wardRequests, setWardRequests] = useState<WardRequest[]>([]);
    const requestCount = useRequestCountStore((state) => state.count);
    const { userInfo } = useUserAuthStore(); // 로그인한 사용자 정보 가져오기

    // Add wardRequests fetch effect
    useEffect(() => {
      const fetchWardRequests = async () => {
        try {
          const requests = await requestService.getWardRequestsByDate(
            year,
            month
          );
          setWardRequests(requests);
        } catch (error) {
          console.error('Failed to fetch ward requests:', error);
          toast.error('근무 요청 내역을 불러오는데 실패했습니다.');
        }
      };

      fetchWardRequests();
    }, [year, month]);

    // 드래그 앤 드롭 상태 및 함수
    const [sortedDutyData, setSortedDutyData] = useState([...dutyData]);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // Local Storage 키 생성 (사용자 ID + 병동 ID + 연월 기반)
    const getLocalStorageKey = () => {
      const userId = userInfo?.memberId || 'unknown';
      const wardId = window.location.pathname.includes('shift-admin')
        ? 'admin'
        : 'team';
      return `nurse-order-${userId}-${wardId}-${year}-${month}`;
    };

    // localStorage에서 간호사 순서 불러오기
    const loadNurseOrderFromStorage = useCallback(() => {
      try {
        const key = getLocalStorageKey();
        const savedOrder = localStorage.getItem(key);

        if (savedOrder) {
          const orderData = JSON.parse(savedOrder);

          // 저장된 순서 정보가 있으면 현재 간호사 목록에 적용
          if (
            Array.isArray(orderData) &&
            orderData.length > 0 &&
            dutyData.length > 0
          ) {
            // 현재 간호사 ID 목록
            const currentNurseIds = dutyData.map((nurse) => nurse.memberId);

            // 저장된 순서에 있는 간호사 ID만 필터링
            const validOrderIds = orderData.filter((id) =>
              currentNurseIds.includes(id)
            );

            // 저장된 순서에 없는 간호사 ID들 (새로 추가된 간호사들)
            const newNurseIds = currentNurseIds.filter(
              (id) => !validOrderIds.includes(id)
            );

            // 최종 순서 = 저장된 순서 + 새로 추가된 간호사들
            const finalOrder = [...validOrderIds, ...newNurseIds];

            // 최종 순서대로 간호사 데이터 정렬
            const orderedNurses = finalOrder
              .map((id) => dutyData.find((nurse) => nurse.memberId === id))
              .filter(Boolean) as typeof dutyData;

            if (orderedNurses.length === dutyData.length) {
              setSortedDutyData(orderedNurses);
            }
          }
        }
      } catch (error) {
        console.error('간호사 순서 불러오기 실패:', error);
      }
    }, [dutyData, year, month, userInfo]);

    // dutyData가 변경되면 로컬 스토리지에서 순서 불러오기
    useEffect(() => {
      if (dutyData.length > 0) {
        loadNurseOrderFromStorage();
      } else {
        setSortedDutyData([]);
      }
    }, [dutyData, loadNurseOrderFromStorage]);

    // 초기화 또는 자동생성이 완료될 때 실행하는 핸들러
    // const handleDutyUpdate = useCallback(async () => {
    //   // 현재 페이지의 데이터를 다시 로드
    //   try {
    //     // Call the onUpdate function to fetch new data
    //     await onUpdate(year, month);

    //     // Directly fetch the latest data from the server to ensure it's up to date
    //     const latestData = await dutyService.getDuty({ year, month });

    //     // Update the local state with the latest data from the server
    //     setSortedDutyData(latestData.duty);

    //     // Also update the shiftStore state to ensure consistency across components
    //     useShiftStore.getState().setDutyInfo(latestData);

    //     // toast.success('근무 데이터가 업데이트되었습니다.');
    //   } catch (error) {
    //     console.error('데이터 업데이트 실패:', error);
    //   }
    // }, [year, month, onUpdate]);

    const resetDutyConfirmed = async () => {
      setIsResetDutyConfirmModalOpen(false);
      setIsResetting(true);
      try {
        await dutyService.resetDuty(year, month);

        // Get the latest data directly from the server
        const latestData = await dutyService.getDuty({ year, month });

        // Update all relevant states with the new data
        setSortedDutyData(latestData.duty);
        useShiftStore.getState().setDutyInfo(latestData);

        // Still call handleDutyUpdate to maintain any additional logic
        await onUpdate(year, month);

        toast.success('초기화되었습니다.');
      } catch (error) {
        toast.error('초기화에 실패하였습니다.');
      } finally {
        setIsResetting(false);
      }
    };

    // dutyData, year, month 중 하나라도 변경되면 데이터를 다시 불러오도록 추가
    useEffect(() => {
      // 이 effect는 year나 month가 변경될 때 데이터를 새로 로드합니다.
      // 변경될 때 이전 데이터가 잘못 표시되는 것을 방지
      setSortedDutyData([...dutyData]);
    }, [year, month, dutyData]);

    // 드래그 앤 드롭 센서 설정
    const sensors = useSensors(
      useSensor(TouchSensor, {
        // 터치 센서 설정
        activationConstraint: {
          delay: 100, // 100ms 딜레이 후 활성화
          tolerance: 5, // 5px 이상 움직여야 활성화
        },
      }),
      useSensor(PointerSensor, {
        // 포인터 센서 설정
        activationConstraint: {
          distance: 5, // 5px 이상 움직여야 활성화
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    // 드래그 앤 드롭 종료 핸들러
    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      try {
        setIsSavingOrder(true);

        // 드래그 앤 드롭 결과로 간호사 목록 재정렬
        const oldIndex = sortedDutyData.findIndex(
          (item) => item.memberId.toString() === active.id
        );
        const newIndex = sortedDutyData.findIndex(
          (item) => item.memberId.toString() === over.id
        );

        // 새 정렬된 간호사 데이터
        const newSortedData = arrayMove(
          [...sortedDutyData],
          oldIndex,
          newIndex
        );

        // 새 정렬된 간호사에 맞게 duties 배열도 동시에 업데이트
        const newDuties = arrayMove([...duties], oldIndex, newIndex);

        // duties를 먼저 업데이트하여 깜빡임 방지
        setDuties(newDuties);

        // 그 다음 sortedDutyData 업데이트
        setSortedDutyData(newSortedData);

        // localStorage에 새 순서 저장
        const key = getLocalStorageKey();
        const nurseOrder = newSortedData.map((nurse) => nurse.memberId);
        localStorage.setItem(key, JSON.stringify(nurseOrder));

        toast.success('간호사 순서가 저장되었습니다');
      } catch (error) {
        console.error('간호사 순서 저장 실패:', error);
        toast.error('간호사 순서 저장에 실패했습니다');
      } finally {
        setIsSavingOrder(false);
      }
    };

    useEffect(() => {
      const checkIsWeb = () => {
        setIsWeb(window.innerWidth >= 1280);
      };

      checkIsWeb();
      window.addEventListener('resize', checkIsWeb);

      return () => {
        window.removeEventListener('resize', checkIsWeb);
      };
    }, []);

    const ruleButtonRef = useRef<HTMLButtonElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const selectedCell = useShiftStore((state) => state.selectedCell);
    const setSelectedCell = useShiftStore((state) => state.setSelectedCell);

    const [isAutoGenCountModalOpen, setIsAutoGenCountModalOpen] =
      useState(false);
    const [autoGenCnt, setAutoGenCnt] = useState(0);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [isSubscriptionSuccessModalOpen, setIsSubscriptionSuccessModalOpen] =
      useState(false);
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('monthly');

    // Add hover state management at component level
    const [hoveredCell, setHoveredCell] = useState<{
      row: number;
      day: number;
    } | null>(null);

    // 현재 달의 일수 계산을 상단으로 이동
    const daysInMonth = new Date(year, month, 0).getDate();

    // Memoize heavy calculations
    const nurses = useMemo(
      () => sortedDutyData.map((nurse) => nurse.name),
      [sortedDutyData]
    );

    // duties 상태 초기화를 단순화
    const [duties, setDuties] = useState<string[][]>([]);

    // 듀티표 초기화 모달 상태
    const [isResetDutyConfirmModalOpen, setIsResetDutyConfirmModalOpen] =
      useState(false);

    // useEffect를 추가하여 dutyData 변경 시 duties 업데이트
    useEffect(() => {
      if (!sortedDutyData || !sortedDutyData.length) {
        setDuties([]);
        return;
      }

      // sortedDutyData에 맞게 duties 배열 생성
      const newDuties = sortedDutyData.map((nurse) => {
        if (!nurse.shifts || nurse.shifts.length === 0) {
          return Array(daysInMonth).fill('X');
        }
        return nurse.shifts.split('');
      });

      setDuties(newDuties);
    }, [sortedDutyData, daysInMonth]);

    const prevShifts = useMemo(
      () => sortedDutyData.map((nurse) => nurse.prevShifts.split('')),
      [sortedDutyData]
    );

    // requests state 제거하고 wardRequests prop 사용
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    const sendBatchRequest = useCallback(
      debounce(async (requests) => {
        try {
          await dutyService.updateShiftBatch(requests);

          // Fetch the updated duty data
          const updatedData = await dutyService.getDuty({ year, month });

          // Update the state with the new data
          useShiftStore.getState().setDutyInfo(updatedData);

          // Clear the pending requests
          setPendingRequests([]);
        } catch (error) {
          console.error('Failed to update shifts:', error);
          // Optionally, revert the optimistic update or notify the user
          toast.error('근무표 수정에 실패했습니다. 다시 시도해주세요.');
        }
      }, 1000),
      [year, month]
    );

    // 근무 변경을 처리하는 핸들러 함수
    const handleShiftChange = useCallback(
      (
        nurseIndex: number,
        dayIndex: number,
        shift: 'D' | 'E' | 'N' | 'O' | 'X' | 'M'
      ) => {
        // nurseIndex나 dayIndex가 유효한지 확인
        if (!duties[nurseIndex] || dayIndex < 0 || dayIndex >= daysInMonth) {
          console.error('Invalid nurse index or day index');
          return;
        }

        const nurse = sortedDutyData[nurseIndex];
        if (!nurse) {
          console.error('Nurse not found');
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
        sortedDutyData,
        year,
        month,
        pendingRequests,
        sendBatchRequest,
        duties,
        daysInMonth,
      ]
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
            case 'ArrowRight':
              e.preventDefault(); // 스크롤 방지
              if (col < daysInMonth - 1) {
                setSelectedCell({ row, col: col + 1 });
              } else if (row < nurses.length - 1) {
                setSelectedCell({ row: row + 1, col: 0 });
              }
              break;
            case 'ArrowLeft':
              e.preventDefault(); // 스크롤 방지
              if (col > 0) {
                setSelectedCell({ row, col: col - 1 });
              } else if (row > 0) {
                setSelectedCell({ row: row - 1, col: daysInMonth - 1 });
              }
              break;
            case 'ArrowUp':
              e.preventDefault(); // 스크롤 방지
              if (row > 0) {
                setSelectedCell({ row: row - 1, col });
              }
              break;
            case 'ArrowDown':
              e.preventDefault(); // 스크롤 방지
              if (row < nurses.length - 1) {
                setSelectedCell({ row: row + 1, col });
              }
              break;
            case 'Delete':
              handleShiftChange(row, col, 'X');
              break;
            case 'Backspace':
              handleShiftChange(row, col, 'X');
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
            'D',
            'E',
            'N',
            'O',
            'X',
            'ㅇ',
            'ㄷ',
            'ㅜ',
            'ㅐ',
            'ㅌ',
            'M',
            'ㅡ',
          ];
          const keyMap: { [key: string]: 'D' | 'E' | 'N' | 'O' | 'X' | 'M' } = {
            ㅇ: 'D',
            ㄷ: 'E',
            ㅜ: 'N',
            ㅐ: 'O',
            ㅌ: 'X',
            ㅡ: 'M',
          };

          if (validKeys.includes(key)) {
            const shiftKey = keyMap[key] || key;
            handleShiftChange(
              row,
              col,
              shiftKey as 'D' | 'E' | 'N' | 'O' | 'X' | 'M'
            );

            if (col < daysInMonth - 1) {
              setSelectedCell({ row, col: col + 1 });
            } else if (row < nurses.length - 1) {
              setSelectedCell({ row: row + 1, col: 0 });
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
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
        toast.warning('다음 달까지만 조회할 수 있습니다.');
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
          M: 0,
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
        const counts: Omit<DutyCounts, 'total'> = {
          D: 0,
          M: 0,
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

    // 주말 체크 헬퍼 함수들
    const isSaturdayDay = (day: number): boolean => {
      return isSaturday(year, month, day);
    };

    const isSundayDay = (day: number): boolean => {
      return isSunday(year, month, day);
    };

    // 주말 스타일 결정 함수
    const getWeekendStyle = (day: number): string => {
      if (isHoliday(year, month, day) || isSundayDay(day))
        return 'text-red-500';
      if (isSaturdayDay(day)) return 'text-blue-500';
      return '';
    };

    // 셀 하이라이트 로직
    const isHighlighted = (row: number, col: number) => {
      if (!selectedCell) return '';

      const baseHighlight = 'transition-all duration-100';

      // 선택된 셀 자체의 하이라이트
      if (row === selectedCell.row && col === selectedCell.col) {
        return `${baseHighlight} bg-duty-off-bg z-[0]`;
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

      return '';
    };

    // Memoize progress calculation
    const progress = useMemo(() => {
      const totalCells = nurses.length * daysInMonth;
      const filledCells = duties.reduce(
        (acc: number, nurseRow: string[]) =>
          acc + nurseRow.filter((duty: string) => duty !== 'X').length,
        0
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
        nurseShifts.every((shift) => shift === 'X' || !shift)
      );
    }, [duties]);

    // Modify handleResetDuty to prevent full page reload
    const handleResetDuty = async () => {
      // 모든 셀이 이미 X인 경우
      if (isAllCellsEmpty) {
        toast.warning('이미 초기화되었습니다.');
        return;
      }

      setIsResetDutyConfirmModalOpen(true);
    };

    const navigate = useNavigate();
    const [isDemoSignupModalOpen, setIsDemoSignupModalOpen] = useState(false);
    const isDemo = userInfo?.isDemo;

    const handleAutoCreate = async () => {
      if (isAutoCreating) {
        toast.warning('이미 자동생성 중입니다.');
        return;
      }

      try {
        // request count가 1 이상이면 RequestCheckModal을 먼저 보여줌
        if (requestCount > 0) {
          setIsRequestCheckModalOpen(true);
          return;
        }

        // 병동 정보 동기화 (M 근무자 수 확인을 위해)
        try {
          const syncWithServer = useWardStore.getState().syncWithServer;
          await syncWithServer();
        } catch (error) {
          console.error('병동 정보 동기화 실패:', error);
          // 동기화 실패 시에도 계속 진행
        }

        // 규칙 정보 먼저 가져오기
        const rules = await ruleService.getWardRules();
        setWardRules(rules);
        setIsFromAutoGenerate(true);

        // DEMO: autogenCnt 0 & demo 계정이면 회원가입 유도 모달
        if (autoGenCnt <= 0 && isDemo) {
          setIsDemoSignupModalOpen(true);
          return;
        }

        // 자동 생성 횟수가 0 이하인 경우 결제 모달로 이동
        if (autoGenCnt <= 0) {
          setIsPaymentModalOpen(true);
          return;
        }

        setIsAutoGenerateModalOpen(true);
      } catch (error) {
        toast.error('규칙을 불러오는데 실패했습니다');
      }
    };

    const handleAutoGenerateConfirm = () => {
      setIsAutoGenerateModalOpen(false);
      setIsAutoGenCountModalOpen(true);
    };

    const [isNurseShortageModalOpen, setIsNurseShortageModalOpen] =
      useState(false);
    const [neededNurseCount, setNeededNurseCount] = useState(0);

    const { addVirtualNurse } = useWardStore();

    // 임시 간호사 추가 핸들러 수정
    const handleAddTemporaryNurses = async (count: number) => {
      try {
        await addVirtualNurse(count);

        // 화면 갱신
        await onUpdate(year, month);

        toast.success(`임시 간호사 ${count}명이 추가되었습니다.`);
      } catch (error) {
        toast.error('임시 간호사 추가에 실패했습니다.');
      }
    };

    // 간호사 부족 계산 커스텀 훅 사용
    const {
      shortage: estimatedNurseShortage,
      wardRules: nurseShortageRules,
      setWardRules: setNurseShortageRules,
    } = useNurseShortageCalculation({
      year,
      month,
      nursesCount: nurses.length,
      initialWardRules: wardRules,
    });

    // 백엔드에서 전달받은 neededNurseCount와 프론트엔드에서 계산한 estimatedNurseShortage 동기화
    useEffect(() => {
      // 백엔드 값이 0이거나 없는 경우 프론트엔드 계산값 사용
      if (!neededNurseCount && estimatedNurseShortage > 0) {
        setNeededNurseCount(estimatedNurseShortage);
      }
    }, [estimatedNurseShortage, neededNurseCount]);

    // wardRules 상태를 nurseShortageRules와 동기화
    useEffect(() => {
      if (
        nurseShortageRules &&
        (!wardRules ||
          JSON.stringify(nurseShortageRules) !== JSON.stringify(wardRules))
      ) {
        setWardRules(nurseShortageRules);
      }
    }, [nurseShortageRules]);

    // wardRules 변경 시 nurseShortageRules도 업데이트
    useEffect(() => {
      if (wardRules) {
        setNurseShortageRules(wardRules);
      }
    }, [wardRules, setNurseShortageRules]);

    // 커스텀 로딩 토스트 컴포넌트 - 반응형 지원
    const ProgressToast: React.FC<{ message: string; progress: number }> = ({
      message,
      progress,
    }) => {
      return (
        // 반응형 너비: 모바일에서는 220px, sm 이상(640px)에서는 280px, md 이상(768px)에서는 320px
        <div className="w-[220px] sm:w-[280px] md:w-[320px]">
          {/* 텍스트 및 퍼센트 영역 - nowrap으로 줄바꿈 방지 */}
          <div className="flex justify-between items-center whitespace-nowrap overflow-hidden mb-1.5">
            <span className="text-xs sm:text-sm font-medium overflow-hidden text-ellipsis pr-2">
              {message}
            </span>
            <span className="text-xs sm:text-sm font-semibold flex-shrink-0">
              {progress}%
            </span>
          </div>

          {/* 프로그레스 바 - 화면 크기에 따라 너비 자동 조정, 높이는 반응형으로 조정 */}
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                progress < 33
                  ? 'bg-primary-10'
                  : progress < 67
                    ? 'bg-primary-30'
                    : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    };

    const executeAutoGenerate = async () => {
      setIsAutoGenCountModalOpen(false);
      try {
        setIsAutoCreating(true);

        // 개선된 로딩 토스트 시스템
        let progressCounter = 0;
        const totalTime = 15000; // 예상 총 소요시간 15초
        const updateInterval = 1000; // 1초마다 메시지 업데이트
        const messageCount = loadingMessages.length;

        // 최초 토스트 메시지 표시 (커스텀 컴포넌트 사용)
        const loadingToastId = toast.loading(
          <ProgressToast message={loadingMessages[0]} progress={0} />,
          { autoClose: false, closeButton: false }
        );

        // 진행 상황 업데이트를 위한 타이머 설정
        const progressTimer = setInterval(() => {
          progressCounter++;
          const elapsedTime = progressCounter * updateInterval;
          const progressPercent = Math.min(
            Math.round((elapsedTime / totalTime) * 100),
            99
          );

          // 메시지 인덱스 계산 (진행률에 따라 다른 메시지 표시)
          const messageIndex = Math.min(
            Math.floor((progressPercent / 100) * messageCount),
            messageCount - 1
          );

          // 토스트 메시지 업데이트 (커스텀 컴포넌트로)
          toast.update(loadingToastId, {
            render: (
              <ProgressToast
                message={loadingMessages[messageIndex]}
                progress={progressPercent}
              />
            ),
            isLoading: true,
          });

          // 99%에서 타이머 중지
          if (progressPercent >= 99) {
            clearInterval(progressTimer);
          }
        }, updateInterval);

        // API 호출
        const response = await dutyService.autoCreateDuty(year, month);

        // 타이머 중지
        clearInterval(progressTimer);

        // Get the latest data directly from the server
        const latestData = await dutyService.getDuty({ year, month });

        // Update all relevant states with the new data
        setSortedDutyData(latestData.duty);
        useShiftStore.getState().setDutyInfo(latestData);

        // Still call onUpdate to maintain any additional logic
        await onUpdate(year, month);

        // 반영되지 않은 요청이 있는 경우 모달 표시
        if (
          response.unreflectedRequestsCount > 0 &&
          response.unreflectedRequests?.length > 0
        ) {
          setUnreflectedRequests(response.unreflectedRequests);
          toast.dismiss(loadingToastId);
          toast.warning('일부 요청은 여전히 반영되지 않았습니다.');
          // 모달을 닫지 않고 계속 표시
          setIsUnreflectedRequestsModalOpen(true);
        } else {
          // 성공 알림
          toast.dismiss(loadingToastId);
          toast.success('선택한 요청이 모두 반영되었습니다.');
          // 모든 요청이 반영된 경우에만 모달 닫기
          setIsUnreflectedRequestsModalOpen(false);
        }

        // 자동 생성 횟수 감소
        setAutoGenCnt((prev) => prev - 1);
      } catch (error: any) {
        // 로딩 토스트 제거
        toast.dismiss();

        if (error.response) {
          switch (error.response.status) {
            case 401:
              toast.error('로그인이 필요합니다.');
              window.location.href = '/login';
              break;
            case 400:
              toast.error('근무 일정을 찾을 수 없습니다.');
              break;
            case 406:
              // 백엔드에서 받은 필요한 간호사 수로 업데이트
              setNeededNurseCount(
                error.response.data.neededNurseCount ||
                  estimatedNurseShortage ||
                  0
              );
              // 간호사 수 부족 시 확인 모달 표시
              setIsNurseShortageModalOpen(true);
              break;
            case 405:
              toast.info('모든 조건을 만족하는 최적의 근무표입니다.');
              break;
            default:
              toast.error('자동생성에 실패했습니다');
          }
        } else {
          toast.error('자동생성에 실패했습니다');
        }
      } finally {
        setIsAutoCreating(false);
      }
    };

    // handleForceAutoGenerate 함수도 유사하게 수정
    const handleForceAutoGenerate = async () => {
      try {
        setIsAutoCreating(true);

        // 개선된 로딩 토스트 시스템
        let progressCounter = 0;
        const totalTime = 15000; // 예상 총 소요시간 15초
        const updateInterval = 1000; // 1초마다 메시지 업데이트
        const messageCount = loadingMessages.length;

        // 최초 토스트 메시지 표시 (커스텀 컴포넌트 사용)
        const loadingToastId = toast.loading(
          <ProgressToast message={loadingMessages[0]} progress={0} />,
          { autoClose: false, closeButton: false }
        );

        // 진행 상황 업데이트를 위한 타이머 설정
        const progressTimer = setInterval(() => {
          progressCounter++;
          const elapsedTime = progressCounter * updateInterval;
          const progressPercent = Math.min(
            Math.round((elapsedTime / totalTime) * 100),
            99
          );

          // 메시지 인덱스 계산 (진행률에 따라 다른 메시지 표시)
          const messageIndex = Math.min(
            Math.floor((progressPercent / 100) * messageCount),
            messageCount - 1
          );

          // 토스트 메시지 업데이트 (커스텀 컴포넌트로)
          toast.update(loadingToastId, {
            render: (
              <ProgressToast
                message={loadingMessages[messageIndex]}
                progress={progressPercent}
              />
            ),
            isLoading: true,
          });

          // 99%에서 타이머 중지
          if (progressPercent >= 99) {
            clearInterval(progressTimer);
          }
        }, updateInterval);

        // 강제 자동생성 API 호출
        const response = await dutyService.autoCreateDuty(year, month, true);

        // 타이머 중지
        clearInterval(progressTimer);

        // Get the latest data directly from the server
        const latestData = await dutyService.getDuty({ year, month });

        // Update all relevant states with the new data
        setSortedDutyData(latestData.duty);
        useShiftStore.getState().setDutyInfo(latestData);

        // Still call onUpdate to maintain any additional logic
        await onUpdate(year, month);

        // 반영되지 않은 요청이 있는 경우 모달 표시
        if (
          response.unreflectedRequestsCount > 0 &&
          response.unreflectedRequests?.length > 0
        ) {
          setUnreflectedRequests(response.unreflectedRequests);
          toast.dismiss(loadingToastId);
          toast.warning('자동생성 완료, 일부 요청은 반영되지 않았습니다.');
          setIsUnreflectedRequestsModalOpen(true);
        } else {
          // 성공 알림
          toast.dismiss(loadingToastId);
          toast.success('자동생성에 성공했습니다');
        }

        // 자동 생성 횟수 감소
        setAutoGenCnt((prev) => prev - 1);
      } catch (error: any) {
        // 로딩 토스트 제거
        toast.dismiss();

        if (error.response) {
          switch (error.response.status) {
            case 401:
              toast.error('로그인이 필요합니다.');
              window.location.href = '/login';
              break;
            case 400:
              toast.error('근무 일정을 찾을 수 없습니다.');
              break;
            case 405:
              toast.info('모든 조건을 만족하는 최적의 근무표입니다.');
              break;
            default:
              toast.error('자동생성에 실패했습니다');
          }
        } else {
          toast.error('자동생성에 실패했습니다');
        }
      } finally {
        setIsAutoCreating(false);
        setIsNurseShortageModalOpen(false);
      }
    };

    const handleSubscribe = async (plan: SubscriptionPlan) => {
      try {
        // 결제 API 호출
        const response = await dutyService.subscribe();

        // 모달 닫기 및 자동 생성 횟수 갱신
        setIsPaymentModalOpen(false);

        // 응답에서 자동 생성 횟수 사용
        if (response && response.addNum !== undefined) {
          setAutoGenCnt(response.addNum);
        } else {
          // 응답에 횟수가 없는 경우 플랜에 따라 기본값 설정
          const defaultCounts = {
            monthly: 100,
            quarterly: 100,
            yearly: 100,
          };
          setAutoGenCnt(defaultCounts[plan]);
        }

        // 현재 선택된 플랜 저장
        setCurrentPlan(plan);

        // 수정된 부분: 자동 생성 모달 대신 구독 성공 모달 표시
        setIsSubscriptionSuccessModalOpen(true);
      } catch (error) {
        setIsPaymentModalOpen(false);
      }
    };

    const handleStartAutoGenerate = () => {
      setIsSubscriptionSuccessModalOpen(false);
      executeAutoGenerate();
    };

    // 근무표 다운로드 기능 대체
    const handleDownloadWardSchedule = async () => {
      const tableElement = document.querySelector('.duty-table-content');
      exportToImage(tableElement as HTMLElement, selectedCell, setSelectedCell);
    };

    // 엑셀 다운로드 함수 대체
    const handleExportToExcel = () => {
      exportToExcel(dutyData, duties, nurseDutyCounts, daysInMonth);
    };

    // URL 쿼리 파라미터로부터 초기 데이터 로드
    useEffect(() => {
      const url = new URL(window.location.href);
      const urlYear = url.searchParams.get('year');
      const urlMonth = url.searchParams.get('month');

      // URL에 year, month가 없을 때만 현재 값으로 설정
      if (!urlYear || !urlMonth) {
        url.searchParams.set('year', year.toString());
        url.searchParams.set('month', month.toString());
        window.history.replaceState({}, '', url.toString());
      }
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    const [isNurseCountModalOpen, setIsNurseCountModalOpen] = useState(false);

    useEffect(() => {
      const checkIsWeb = () => {
        setIsWeb(window.innerWidth >= 1280);
      };

      checkIsWeb();
      window.addEventListener('resize', checkIsWeb);

      return () => {
        window.removeEventListener('resize', checkIsWeb);
      };
    }, []);

    useEffect(() => {
      const fetchShiftRules = async () => {
        try {
          const rules = await ruleService.getWardRules();
          setWardRules(rules);
        } catch (error) {
          console.error('Failed to fetch ward rules:', error);
        }
      };
      fetchShiftRules();
    }, []);

    const getCountColor = (
      count: number,
      day: number,
      shiftType: 'D' | 'E' | 'N'
    ) => {
      if (!wardRules) return '';

      // 주말 또는 공휴일인지 확인
      const isWeekendOrHoliday =
        isSaturdayDay(day) || isSundayDay(day) || isHoliday(year, month, day);

      // 주말/공휴일 또는 평일에 따라 다른 목표 인원수 적용
      const targetCount = isWeekendOrHoliday
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

      if (count === targetCount) return 'text-green-600 font-medium';
      if (count > targetCount) return 'text-blue-600 font-medium';
      return 'text-red-600 font-medium';
    };

    useEffect(() => {
      const fetchAutoGenCount = async () => {
        try {
          const data = await dutyService.getAutoGenCount();
          setAutoGenCnt(data); // API 응답 구조에 따라 조정
        } catch (error) {}
      };

      fetchAutoGenCount();
    }, []);

    // 규칙 설정 버튼 클릭 핸들러 추가
    const handleRuleButtonClick = async () => {
      try {
        // 규칙 정보 가져오기
        const rules = await ruleService.getWardRules();
        setWardRules(rules);
        setIsFromAutoGenerate(false);
        setIsRuleModalOpen(true);
      } catch (error) {
        toast.error('규칙을 불러오는데 실패했습니다');
      }
    };

    // 자동생성 경로에서 규칙 수정 후 처리하는 핸들러 추가
    const handleRuleUpdateFromAutoGenerate = (newRules: WardRule) => {
      setWardRules(newRules);
      setIsRuleModalOpen(false);
      setIsAutoGenerateModalOpen(true);
    };

    const fetchHolidays = useHolidayStore(
      (state: {
        fetchHolidays: (year: number, month: number) => Promise<void>;
      }) => state.fetchHolidays
    );

    // 공휴일 데이터 불러오기
    useEffect(() => {
      fetchHolidays(year, month);
    }, [year, month, fetchHolidays]);

    // 모바일 플로팅 버튼 상태
    const [showMobileButton, setShowMobileButton] = useState(false);

    // 모바일 플로팅 버튼 클릭 핸들러
    const handleMobileButtonClick = (
      dutyType: 'D' | 'E' | 'N' | 'M' | 'O' | 'X'
    ) => {
      if (!selectedCell) return;

      // 선택된 셀에 근무 적용
      handleShiftChange(selectedCell.row, selectedCell.col, dutyType);

      // 다음 셀로 이동 (오른쪽 또는 다음 행 첫 번째 셀)
      if (selectedCell.col < daysInMonth - 1) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
      } else if (selectedCell.row < nurses.length - 1) {
        setSelectedCell({ row: selectedCell.row + 1, col: 0 });
      }
    };

    // 셀 선택 시 모바일 플로팅 버튼 표시
    useEffect(() => {
      setShowMobileButton(!!selectedCell);
    }, [selectedCell]);

    // 셀 외 영역 클릭 감지를 위한 useEffect 추가
    useEffect(() => {
      // 셀 외부 클릭 처리 함수
      const handleClickOutside = (e: MouseEvent) => {
        // 선택된 셀이 없으면 무시
        if (!selectedCell) return;

        const target = e.target as HTMLElement;

        // 셀이나 버튼, 근무 배지 요소인지 확인
        const isCell = target.closest('td');
        const isButton = target.closest('button');
        const isDutyBadge = target.closest('.duty-badge-eng'); // DutyBadgeEng에 클래스 추가 필요할 수 있음

        // 셀, 버튼, 배지가 아닌 영역 클릭 시 선택 해제
        if (!isCell && !isButton && !isDutyBadge) {
          setSelectedCell(null);
        }
      };

      // 전역 클릭 이벤트 등록
      document.addEventListener('click', handleClickOutside);

      // 클린업 함수
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [selectedCell, setSelectedCell]);

    const handleRequestCheckModalClose = () => {
      setIsRequestCheckModalOpen(false);
    };

    const handleRequestCheckModalConfirm = async () => {
      setIsRequestCheckModalOpen(false);
      try {
        // 병동 정보 동기화 (M 근무자 수 확인을 위해)
        try {
          const syncWithServer = useWardStore.getState().syncWithServer;
          await syncWithServer();
        } catch (error) {
          console.error('병동 정보 동기화 실패:', error);
          // 동기화 실패 시에도 계속 진행
        }

        // 규칙 정보 먼저 가져오기
        const rules = await ruleService.getWardRules();
        setWardRules(rules);
        setIsFromAutoGenerate(true);

        // DEMO: autogenCnt 0 & demo 계정이면 회원가입 유도 모달
        if (autoGenCnt <= 0 && isDemo) {
          setIsDemoSignupModalOpen(true);
          return;
        }

        // 자동 생성 횟수가 0 이하인 경우 결제 모달로 이동
        if (autoGenCnt <= 0) {
          setIsPaymentModalOpen(true);
          return;
        }

        setIsAutoGenerateModalOpen(true);
      } catch (error) {
        toast.error('규칙을 불러오는데 실패했습니다');
      }
    };

    // 승인된 요청 적용 hook 사용
    useApplyAcceptedRequestsDemoOnly(
      dutyData,
      wardRequests,
      year,
      month,
      setDuties
    );

    // Add state for unreflected requests modal
    const [isUnreflectedRequestsModalOpen, setIsUnreflectedRequestsModalOpen] =
      useState(false);
    const [unreflectedRequests, setUnreflectedRequests] = useState<
      UnreflectedRequest[]
    >([]);

    // handleRegenerateWithPriority 함수도 유사하게 수정
    const handleRegenerateWithPriority = async (
      selectedRequestIds: number[]
    ) => {
      try {
        setIsAutoCreating(true);

        // 개선된 로딩 토스트 시스템
        let progressCounter = 0;
        const totalTime = 15000; // 예상 총 소요시간 15초
        const updateInterval = 1000; // 1초마다 메시지 업데이트
        const messageCount = loadingMessages.length;

        // 최초 토스트 메시지 표시 (커스텀 컴포넌트 사용)
        const loadingToastId = toast.loading(
          <ProgressToast message={loadingMessages[0]} progress={0} />,
          { autoClose: false, closeButton: false }
        );

        // 진행 상황 업데이트를 위한 타이머 설정
        const progressTimer = setInterval(() => {
          progressCounter++;
          const elapsedTime = progressCounter * updateInterval;
          const progressPercent = Math.min(
            Math.round((elapsedTime / totalTime) * 100),
            99
          );

          // 메시지 인덱스 계산 (진행률에 따라 다른 메시지 표시)
          const messageIndex = Math.min(
            Math.floor((progressPercent / 100) * messageCount),
            messageCount - 1
          );

          // 토스트 메시지 업데이트 (커스텀 컴포넌트로)
          toast.update(loadingToastId, {
            render: (
              <ProgressToast
                message={loadingMessages[messageIndex]}
                progress={progressPercent}
              />
            ),
            isLoading: true,
          });

          // 99%에서 타이머 중지
          if (progressPercent >= 99) {
            clearInterval(progressTimer);
          }
        }, updateInterval);

        // 새로운 재생성 API 호출
        const response = await dutyService.reAutoCreateDuty(
          year,
          month,
          selectedRequestIds
        );

        // 타이머 중지
        clearInterval(progressTimer);

        // Get the latest data directly from the server
        const latestData = await dutyService.getDuty({ year, month });

        // Update all relevant states with the new data
        setSortedDutyData(latestData.duty);
        useShiftStore.getState().setDutyInfo(latestData);

        // Still call onUpdate to maintain any additional logic
        await onUpdate(year, month);

        // 반영되지 않은 요청이 있는 경우 모달 표시
        if (
          response.unreflectedRequestsCount > 0 &&
          response.unreflectedRequests?.length > 0
        ) {
          // 새로운 요청 리스트로 업데이트
          setUnreflectedRequests(response.unreflectedRequests);
          toast.dismiss(loadingToastId);
          toast.warning('일부 요청은 여전히 반영되지 않았습니다.');
          // 모달을 닫지 않고 계속 표시
          setIsUnreflectedRequestsModalOpen(true);
        } else {
          // 모든 요청이 반영된 경우
          toast.dismiss(loadingToastId);
          toast.success('선택한 요청이 모두 반영되었습니다.');
          // 모든 요청이 반영된 경우에만 모달 닫기
          setIsUnreflectedRequestsModalOpen(false);
        }

        // 자동 생성 횟수 감소
        setAutoGenCnt((prev) => prev - 1);
      } catch (error: any) {
        // 에러 처리
        toast.error('재생성에 실패했습니다');
      } finally {
        setIsAutoCreating(false);
      }
    };

    // 내보내기 훅 사용
    const { isExporting, exportToImage, exportToExcel } = useShiftExport(
      year,
      month
    );

    // 맨 마지막에 필요한 반환값 추가
    return (
      <div>
        {/* 간호사 부족 알림 배너 */}
        <NurseShortageAlert
          shortage={estimatedNurseShortage}
          onRuleButtonClick={handleRuleButtonClick}
        />

        {/* 모바일 뷰 */}
        <div className="xl:hidden">
          {/* 상단 컨트롤 영역 - MobileShiftControls 컴포넌트로 대체 */}
          <MobileShiftControls
            year={year}
            month={month}
            autoGenCnt={autoGenCnt}
            isExporting={isExporting}
            isAllCellsEmpty={isAllCellsEmpty}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onReset={handleResetDuty}
            onRuleClick={handleRuleButtonClick}
            onAutoCreate={handleAutoCreate}
            onDownloadImage={handleDownloadWardSchedule}
            onDownloadExcel={handleExportToExcel}
          />

          {/* 기존 테이블 영역 - onClick 핸들러 제거 */}
          <div className="overflow-x-auto bg-white rounded-xl p-[0.5rem] shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
            <div
              className={`min-w-[800px] relative ${isWeb ? '' : 'duty-table-content'}`}
            >
              <SpinnerOverlay
                isActive={isResetting || isSavingOrder || isAutoCreating}
              />
              {/* 기존 테이블 내용을 여기에 복사 */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
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
                            className={`p-0 text-center w-10 border-r border-gray-200 ${getWeekendStyle(
                              day
                            )}`}
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
                    <SortableContext
                      items={sortedDutyData.map((nurse) =>
                        nurse.memberId.toString()
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedDutyData.map((nurse, i) => (
                        <SortableNurseRow
                          key={nurse.memberId}
                          index={i}
                          nurse={nurse}
                          duties={duties[i] || []}
                          prevShifts={prevShifts}
                          selectedCell={selectedCell}
                          hoveredCell={hoveredCell}
                          issues={issues}
                          wardRequests={wardRequests}
                          daysInMonth={daysInMonth}
                          isResetting={isResetting}
                          nurseDutyCounts={nurseDutyCounts[i] || {}}
                          handleCellClick={handleCellClick}
                          setHoveredCell={setHoveredCell}
                          isHighlighted={isHighlighted}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                  {/* 통계 행들을 같은 테이블에 직접 추가 */}
                  <tbody>
                    {['DAY', 'EVENING', 'NIGHT', 'OFF', 'TOTAL'].map(
                      (text, i) => (
                        <tr
                          key={`empty-${i}`}
                          className="text-[10px] h-6 border-b border-gray-200"
                        >
                          <td
                            colSpan={2}
                            className={`p-0 font-bold text-[11px] border-r border-gray-200 ${
                              i === 0
                                ? 'text-[#318F3D]'
                                : i === 1
                                  ? 'text-[#E55656]'
                                  : i === 2
                                    ? 'text-[#532FC8]'
                                    : i === 3
                                      ? 'text-[#726F5A]'
                                      : 'text-black'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              <span translate="no">{text}</span>
                            </div>
                          </td>
                          {Array.from({ length: daysInMonth }, (_, j) => (
                            <td
                              key={j}
                              className={`p-0 text-center text-[11px] border-r border-gray-200 ${
                                selectedCell?.col === j
                                  ? i === 4
                                    ? 'bg-duty-off-bg rounded-b-lg'
                                    : 'bg-duty-off-bg'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-center h-6">
                                {i === 0 && (
                                  <span
                                    className={getCountColor(
                                      dutyCounts[j].D,
                                      j + 1,
                                      'D'
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
                                      'E'
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
                                      'N'
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
                      )
                    )}
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>

          {/* 모바일용 플로팅 버튼 그룹 - 외부 컴포넌트 사용 */}
          <MobileDutyControls
            isVisible={showMobileButton}
            onDutySelect={handleMobileButtonClick}
            onClose={() => setShowMobileButton(false)}
          />
        </div>

        {/* 웹 뷰 */}
        <div className="hidden xl:block">
          <div
            className="bg-white rounded-[0.92375rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] p-[1.5rem]"
            ref={tableRef}
          >
            {/* 상단 컨트롤 영역 - DesktopShiftControls 컴포넌트로 대체 */}
            <DesktopShiftControls
              year={year}
              month={month}
              autoGenCnt={autoGenCnt}
              isExporting={isExporting}
              isAllCellsEmpty={isAllCellsEmpty}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onReset={handleResetDuty}
              onRuleClick={handleRuleButtonClick}
              onAutoCreate={handleAutoCreate}
              onDownloadImage={handleDownloadWardSchedule}
              onDownloadExcel={handleExportToExcel}
            />

            {/* 근무표, 통계, 완성도를 하나의 상자로 통합 */}
            <div className="bg-white rounded-xl p-[0.5rem] shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.1)]">
              <div className="relative">
                <SpinnerOverlay
                  isActive={
                    isResetting || isLoading || isSavingOrder || isAutoCreating
                  }
                />
                <div className="overflow-x-auto">
                  <div
                    className={`min-w-[50rem] ${isWeb ? 'duty-table-content' : ''}`}
                  >
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
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
                                  className={`p-0 text-center w-10 border-r border-gray-200 ${getWeekendStyle(
                                    day
                                  )}`}
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
                          <SortableContext
                            items={sortedDutyData.map((nurse) =>
                              nurse.memberId.toString()
                            )}
                            strategy={verticalListSortingStrategy}
                          >
                            {sortedDutyData.map((nurse, i) => (
                              <SortableNurseRow
                                key={nurse.memberId}
                                index={i}
                                nurse={nurse}
                                duties={duties[i] || []}
                                prevShifts={prevShifts}
                                selectedCell={selectedCell}
                                hoveredCell={hoveredCell}
                                issues={issues}
                                wardRequests={wardRequests}
                                daysInMonth={daysInMonth}
                                isResetting={isResetting}
                                nurseDutyCounts={nurseDutyCounts[i] || {}}
                                handleCellClick={handleCellClick}
                                setHoveredCell={setHoveredCell}
                                isHighlighted={isHighlighted}
                              />
                            ))}
                          </SortableContext>
                        </tbody>
                        {/* 통계 행들을 같은 테이블에 직접 추가 */}
                        <tbody>
                          {['DAY', 'EVENING', 'NIGHT', 'OFF', 'TOTAL'].map(
                            (text, i) => (
                              <tr
                                key={`empty-${i}`}
                                className="text-[10px] h-6 border-b border-gray-200"
                              >
                                <td
                                  colSpan={2}
                                  className={`p-0 font-bold text-[11px] border-r border-gray-200 ${
                                    i === 0
                                      ? 'text-[#318F3D]'
                                      : i === 1
                                        ? 'text-[#E55656]'
                                        : i === 2
                                          ? 'text-[#532FC8]'
                                          : i === 3
                                            ? 'text-[#726F5A]'
                                            : 'text-black'
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <span translate="no">{text}</span>
                                  </div>
                                </td>
                                {Array.from({ length: daysInMonth }, (_, j) => (
                                  <td
                                    key={j}
                                    className={`p-0 text-center text-[11px] border-r border-gray-200 ${
                                      selectedCell?.col === j
                                        ? i === 4
                                          ? 'bg-duty-off-bg rounded-b-lg'
                                          : 'bg-duty-off-bg'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-center h-6">
                                      {i === 0 && (
                                        <span
                                          className={getCountColor(
                                            dutyCounts[j].D,
                                            j + 1,
                                            'D'
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
                                            'E'
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
                                            'N'
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
                            )
                          )}
                        </tbody>
                      </table>
                    </DndContext>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 공통 모달 영역 - 뷰포트 외부에 배치 */}
        {isRuleModalOpen && (
          <RuleEditModal
            onClose={() => {
              setIsRuleModalOpen(false);
              setIsFromAutoGenerate(false);
            }}
            buttonRef={ruleButtonRef}
            onRuleUpdate={(newRules) => setWardRules(newRules)}
            isFromAutoGenerate={isFromAutoGenerate}
            onRuleUpdateFromAutoGenerate={handleRuleUpdateFromAutoGenerate}
          />
        )}
        <NurseCountModal
          isOpen={isNurseCountModalOpen}
          onClose={() => setIsNurseCountModalOpen(false)}
          onConfirm={() => {
            setIsNurseCountModalOpen(false);
            navigate('/ward-admin');
          }}
          neededNurseCount={neededNurseCount}
        />

        <AutoGenerateConfirmModal
          isOpen={isAutoGenerateModalOpen}
          onClose={() => {
            setIsAutoGenerateModalOpen(false);
            setIsFromAutoGenerate(false);
          }}
          onConfirm={handleAutoGenerateConfirm}
          onModify={(newRules) => {
            setWardRules(newRules);
            setIsAutoGenerateModalOpen(false);
          }}
          wardRules={wardRules}
          autoGenCnt={autoGenCnt}
        />

        <AutoGenCountModal
          isOpen={isAutoGenCountModalOpen}
          onClose={() => setIsAutoGenCountModalOpen(false)}
          onConfirm={executeAutoGenerate}
          autoGenCnt={autoGenCnt}
          onOpenPayment={() => {
            setIsPaymentModalOpen(true);
          }}
        />

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubscribe={handleSubscribe}
        />

        <SubscriptionSuccessModal
          isOpen={isSubscriptionSuccessModalOpen}
          onClose={() => setIsSubscriptionSuccessModalOpen(false)}
          onConfirm={handleStartAutoGenerate}
          plan={currentPlan}
          autoGenCnt={autoGenCnt}
        />

        <DemoSignupModal
          isOpen={isDemoSignupModalOpen}
          onClose={() => setIsDemoSignupModalOpen(false)}
          onSignup={() => {
            setIsDemoSignupModalOpen(false);
            navigate('/login');
          }}
          onContinue={() => setIsDemoSignupModalOpen(false)}
        />

        <ResetDutyConfirmModal
          isOpen={isResetDutyConfirmModalOpen}
          onClose={() => setIsResetDutyConfirmModalOpen(false)}
          onConfirm={resetDutyConfirmed}
        />

        <NurseShortageModal
          isOpen={isNurseShortageModalOpen}
          onClose={() => setIsNurseShortageModalOpen(false)}
          onForceGenerate={handleForceAutoGenerate}
          onAddTemporaryNurses={handleAddTemporaryNurses}
          executeAutoGenerate={executeAutoGenerate}
          neededNurseCount={neededNurseCount}
          currentNurseCount={nurses.length}
        />

        {/* RequestCheckModal 추가 */}
        <RequestCheckModal
          isOpen={isRequestCheckModalOpen}
          onClose={handleRequestCheckModalClose}
          onAutoGenerate={handleRequestCheckModalConfirm}
          year={year}
          month={month}
        />

        {/* Add the UnreflectedRequestsModal */}
        <UnreflectedRequestsModal
          isOpen={isUnreflectedRequestsModalOpen}
          onClose={() => setIsUnreflectedRequestsModalOpen(false)}
          unreflectedRequests={unreflectedRequests}
          onRegenerateWithPriority={handleRegenerateWithPriority}
        />
      </div>
    );
  }
);

ShiftAdminTable.displayName = 'ShiftAdminTable';

export default ShiftAdminTable;
