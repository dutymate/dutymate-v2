import { useEffect } from 'react';
import useUserAuthStore from '@/stores/userAuthStore';
import { WardRequest } from '@/services/requestService';

interface DutyData {
  memberId: number;
  name: string;
  shifts: string;
}

export const useApplyAcceptedRequestsDemoOnly = (
  dutyData: DutyData[],
  requests: WardRequest[],
  year: number,
  month: number,
  setDuties: (duties: string[][]) => void
) => {
  const { userInfo } = useUserAuthStore();

  useEffect(() => {
    // 데모 계정이 아닐 경우 실행하지 않음
    if (!userInfo?.isDemo) return;

    // 승인된 요청이 없거나 근무 데이터가 없으면 실행하지 않음
    if (!requests?.length || !dutyData?.length) return;

    // 현재 근무표를 2차원 배열로 변환
    const currentDuties = dutyData.map((nurse) => nurse.shifts.split(''));

    // 승인된 요청을 근무표에 반영
    const updatedDuties = currentDuties.map((nurseShifts, nurseIndex) => {
      const nurse = dutyData[nurseIndex];

      // 해당 간호사의 승인된 요청들을 찾음
      const acceptedRequests = requests.filter(
        (req) =>
          req.memberId === nurse.memberId &&
          req.status === 'ACCEPTED' &&
          new Date(req.date).getFullYear() === year &&
          new Date(req.date).getMonth() + 1 === month
      );

      // 승인된 요청이 없으면 기존 근무 유지
      if (!acceptedRequests.length) return nurseShifts;

      // 근무표 복사
      const updatedShifts = [...nurseShifts];

      // 승인된 요청 반영
      acceptedRequests.forEach((req) => {
        const day = new Date(req.date).getDate();
        updatedShifts[day - 1] = req.shift;
      });

      return updatedShifts;
    });

    // 업데이트된 근무표 설정
    setDuties(updatedDuties);
  }, [dutyData, requests, year, month, setDuties, userInfo?.isDemo]);
};
