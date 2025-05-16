import { useState, useEffect, useCallback } from 'react';
import {
  getDefaultOffDays,
  isSaturday as isSaturdayDay,
  isSunday as isSundayDay,
  isHoliday,
} from '@/utils/dateUtils';
import { ruleService, WardRule } from '@/services/ruleService';

interface UseNurseShortageCalculationProps {
  year: number;
  month: number;
  nursesCount: number;
  initialWardRules?: WardRule | null;
  nightNurseCount?: number; // 야간 전담 간호사 수
}

/**
 * 간호사 부족 계산을 위한 커스텀 훅
 * 백엔드의 NurseScheduler.neededNurseCount 로직과 일치하도록 구현
 * @param year 년도
 * @param month 월
 * @param nursesCount 현재 간호사 수
 * @param initialWardRules 초기 wardRules (없으면 자동 로드)
 * @param nightNurseCount 야간 전담 간호사 수 (기본값: 0)
 * @returns { shortage: 부족한 간호사 수, wardRules: 병동 규칙 }
 */
const useNurseShortageCalculation = ({
  year,
  month,
  nursesCount,
  initialWardRules = null,
  nightNurseCount = 0,
}: UseNurseShortageCalculationProps) => {
  const [shortage, setShortage] = useState(0);
  const [wardRules, setWardRules] = useState<WardRule | null>(initialWardRules);

  /**
   * 필요한 간호사 수 계산을 위한 함수
   * 백엔드의 NurseScheduler.neededNurseCount 메소드와 동일한 로직 구현
   */
  const calculateRequiredNurses = useCallback(() => {
    if (!wardRules) return 0;

    // 1. 평일/주말 계산
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekendDays = Array.from(
      { length: daysInMonth },
      (_, i) => i + 1
    ).filter(
      (day) =>
        isSaturdayDay(year, month, day) ||
        isSundayDay(year, month, day) ||
        isHoliday(year, month, day)
    ).length;
    const weekdayDays = daysInMonth - weekendDays;

    // 2. 평일/주말 필요 근무 수 계산
    const weekdayShifts =
      wardRules.wdayDCnt + wardRules.wdayECnt + wardRules.wdayNCnt;
    const weekendShifts =
      wardRules.wendDCnt + wardRules.wendECnt + wardRules.wendNCnt;

    // 3. 총 필요 근무 수 계산
    const totalRequiredShifts =
      weekdayShifts * weekdayDays + weekendShifts * weekendDays;

    // 4. 야간 전담 간호사가 없는 경우
    if (nightNurseCount === 0) {
      let nurseCount = 1;
      const workableDays = daysInMonth - getDefaultOffDays(year, month);

      while (nurseCount * workableDays < totalRequiredShifts) {
        nurseCount++;
      }
      return Math.max(0, nurseCount - nursesCount);
    }

    // 5. 야간 전담 간호사가 있는 경우
    const nightNurseCapacity = nightNurseCount * (daysInMonth / 2); // 야간 전담 간호사는 6일 중 3일 근무
    const remainingShifts = totalRequiredShifts - nightNurseCapacity;

    let normalNurseCount = 1;
    const workableDays = daysInMonth - getDefaultOffDays(year, month);

    while (normalNurseCount * workableDays < remainingShifts) {
      normalNurseCount++;
    }

    const totalNeededNurses = normalNurseCount + nightNurseCount;
    return Math.max(0, totalNeededNurses - nursesCount);
  }, [wardRules, year, month, nursesCount, nightNurseCount]);

  // 규칙 정보 로드 시 필요 간호사 수 계산
  useEffect(() => {
    if (wardRules) {
      const calculatedShortage = calculateRequiredNurses();
      setShortage(calculatedShortage);
    }
  }, [wardRules, calculateRequiredNurses]);

  // 컴포넌트 마운트 시 wardRules 로드
  useEffect(() => {
    const fetchRules = async () => {
      try {
        if (!wardRules) {
          const rules = await ruleService.getWardRules();
          setWardRules(rules);
        }
      } catch (error) {
        console.error('wardRules 로드 실패:', error);
      }
    };

    fetchRules();
  }, [wardRules]);

  return {
    shortage,
    wardRules,
    setWardRules,
  };
};

export default useNurseShortageCalculation;
