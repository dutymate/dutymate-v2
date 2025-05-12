import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/atoms/Button';
import CustomButton from '@/components/atoms/CustomButton';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import { Tooltip } from '@/components/atoms/Tooltip';
import ReqShiftModal from '@/components/organisms/ReqShiftModal';

import { dutyService } from '@/services/dutyService';
import { useLoadingStore } from '@/stores/loadingStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useHolidayStore } from '@/stores/holidayStore';
import { TeamShiftTableDownload } from '@/utils/TeamShiftTableDownload';
import {
  getDayOfWeekKo,
  getDaysInMonth,
  isWeekend,
  isHoliday,
} from '@/utils/dateUtils';
import userService from '@/services/userService';
import WaitingForApproval from './WaitingForApproval';
import EnterWardForm from './EnterWardForm';
import { wardService } from '@/services/wardService';

interface WardDuty {
  id: string;
  year: number;
  month: number;
  duty: {
    memberId: number;
    name: string;
    shifts: string;
    role: string;
    grade: number;
  }[];
}

const TeamShiftTable = () => {
  const [wardDuty, setWardDuty] = useState<WardDuty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [isEnteringWard, setIsEnteringWard] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const { userInfo, setUserInfo } = useUserAuthStore();
  const fetchHolidays = useHolidayStore((state) => state.fetchHolidays);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.year, prev.month - 2);
      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1,
      };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.year, prev.month);
      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1,
      };
    });
  };

  useEffect(() => {
    const fetchWardDuty = async () => {
      useLoadingStore.getState().setLoading(true);
      try {
        // 병동 소속 여부 최신 상태 확인 (API 호출)
        const isExistMyWard = await userService.existWardStatus();
        const isWaiting = await userService.enterWaitingStatus();

        // 최신 사용자 정보 사용 (userInfo가 최신 상태)
        if (!userInfo) {
          useLoadingStore.getState().setLoading(false);
          return;
        }

        // userInfo 최신화
        setUserInfo({
          ...userInfo,
          existMyWard: isExistMyWard,
          sentWardCode: isWaiting,
        });

        if (userInfo.existMyWard) {
          const data = await dutyService.getWardDuty(
            currentDate.year,
            currentDate.month
          );
          setWardDuty(data);

          // 공휴일 데이터도 함께 불러오기
          await fetchHolidays(currentDate.year, currentDate.month);
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('병동 근무표를 불러오는데 실패했습니다');
        }
      } finally {
        setIsLoading(false);
        useLoadingStore.getState().setLoading(false);
      }
    };

    fetchWardDuty();
  }, [currentDate, fetchHolidays]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  const handleEnterWard = async (wardCode: string) => {
    try {
      // 1. 병동 코드 확인
      await wardService.checkWardCode(wardCode);

      // 2. 병동 입장 대기 성공 시 사용자 정보 업데이트
      setUserInfo({
        ...userInfo!,
        existMyWard: false,
        sentWardCode: true,
      });

      // 3. 성공 메시지 표시
      toast.success('병동 입장 요청이 완료되었습니다.');
    } catch (error: any) {
      console.error('병동 입장 실패:', error);
      if (error instanceof Error) {
        if (error.message === '서버 연결 실패') {
          toast.error('잠시 후 다시 시도해주세요');
          return;
        }
        if (error.message === 'UNAUTHORIZED') {
          return;
        }
      }
      if (error?.response?.status === 400) {
        toast.error(error.response.data.message);
        return;
      }
      // 그 외의 모든 에러는 에러 페이지로 이동
    }
  };

  if (isEnteringWard) {
    return (
      <div className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-4 sm:p-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center">
            {userInfo?.sentWardCode ? (
              <WaitingForApproval />
            ) : (
              <div className="w-full max-w-[20rem] mx-auto flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-primary mt-1">
                    병동 입장하기
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-ㅡㅇ mt-3 mb-1">
                    관리자로부터 받은 6자리{' '}
                    <span className="text-primary-dark font-semibold">
                      병동 코드
                    </span>
                    를 입력해주세요.
                    <br />
                    코드는 병동 관리자에게 문의하실 수 있습니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm w-full">
                  <div className="p-2">
                    <EnterWardForm
                      onSubmit={handleEnterWard}
                      onCancel={() => setIsEnteringWard(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!wardDuty) {
    return (
      <div className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-4 sm:p-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            {/* 아이콘 섹션 */}
            <div>
              <div className="relative">
                <div className="w-16 h-16 bg-primary-10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary-dark"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="absolute -top-1 -right-1 bg-primary-dark rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 컨텐츠 섹션 */}
            <div className="w-full text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-black mb-2">
                함께하는 근무가 더 즐겁습니다!
              </h2>
              <p className="text-gray-600 mb-3 text-sm sm:text-base leading-relaxed">
                병동에 입장하여 동료들과 함께
                <br />
                <span className="text-primary-dark font-semibold">
                  듀티메이트
                </span>
                의 모든 기능을 활용해보세요.
                <br />
                근무 교대와 일정 관리가 훨씬 쉬워집니다.
              </p>

              <div className="bg-primary-10 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm sm:text-base font-semibold text-black mb-3 text-center">
                  병동 입장 시 이용 가능한 기능
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary-dark mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    팀원 전체 근무표 한눈에 확인
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary-dark mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    근무 교대 요청 및 관리 간편화
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary-dark mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    근무표 자동 다운로드 및 공유
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 w-full">
                <CustomButton
                  className="flex-1 flex items-center justify-center text-sm sm:text-base rounded-lg hover:from-primary-dark hover:to-primary-dark transition-all bg-gradient-to-r from-primary-dark to-primary-dark text-white font-semibold"
                  style={{ minHeight: '2.75rem' }}
                  onClick={() => setIsEnteringWard(true)}
                >
                  병동 입장하기
                </CustomButton>
                <CustomButton
                  className="flex-1 flex items-center justify-center text-sm sm:text-base rounded-lg transition-all bg-primary-10 text-primary-dark font-semibold hover:bg-primary-20"
                  style={{ minHeight: '2.75rem' }}
                  onClick={() => toast.info('친구 초대 기능 준비 중입니다.')}
                >
                  친구 초대하기
                </CustomButton>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                이미 병동 코드가 있으신가요?{' '}
                <span
                  onClick={() => setIsEnteringWard(true)}
                  className="text-primary-dark hover:underline cursor-pointer"
                >
                  입장하기
                </span>
                를 클릭하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // 해당 월의 실제 일수 계산
  const daysInMonth = getDaysInMonth(wardDuty.year, wardDuty.month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 주말 체크 함수
  const isWeekendDay = (year: number, month: number, day: number) => {
    return isWeekend(year, month, day);
  };

  // 근무표 다운로드 기능
  const handleDownloadWardSchedule = async () => {
    if (!wardDuty || !tableRef.current) return;

    const tableElement = tableRef.current.querySelector('.duty-table-content');
    if (!tableElement) return;

    await TeamShiftTableDownload({
      year: wardDuty.year,
      month: wardDuty.month,
      tableElement: tableElement as HTMLElement,
    });
  };

  return (
    <div
      ref={tableRef}
      className="bg-white rounded-[0.92375rem] shadow-[0_0_15px_rgba(0,0,0,0.1)] p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <div className="w-[11.25rem] hidden sm:block">
          {/* 왼쪽 여백 공간 */}
        </div>
        <div className="flex items-center gap-4 sm:gap-14 mb-4 sm:mb-0">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-[0.9rem] lg:text-lg font-medium whitespace-nowrap">
            {wardDuty.year}년 {wardDuty.month}월
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-[11.25rem] justify-center sm:justify-end shrink-0">
          <Button
            color="primary"
            size="sm"
            className="whitespace-nowrap px-4 sm:px-4 w-[45%] sm:w-auto text-sm"
            onClick={() => setIsReqModalOpen(true)}
          >
            근무 요청
          </Button>
          <Button
            color="off"
            size="sm"
            className={`whitespace-nowrap px-2 sm:px-3 w-[45%] sm:w-auto text-sm ${userInfo?.isDemo ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !userInfo?.isDemo && handleDownloadWardSchedule()}
          >
            <div className="flex items-center gap-1">
              다운로드
              {userInfo?.isDemo && (
                <div className="hidden sm:block">
                  <Tooltip
                    content="로그인 후 이용해주세요"
                    className="ml-1"
                    width="w-40"
                  />
                </div>
              )}
            </div>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto relative w-full">
        <div className="duty-table-content min-w-[640px] relative">
          <table className="w-full border-collapse">
            <colgroup>
              <col className="w-[3rem] sm:w-[4rem] lg:w-[5.5rem]" />
              {days.map((day) => (
                <col
                  key={`col-${day}`}
                  className={`w-[calc((100%-3rem)/31)] sm:w-[calc((100%-4rem)/31)] lg:w-[calc((100%-5.5rem)/31)] ${
                    isWeekendDay(wardDuty.year, wardDuty.month, day)
                      ? 'bg-base-muted-30'
                      : ''
                  }`}
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20">
              <tr className="bg-white">
                <th className="px-1 sm:px-1.5 lg:px-2 py-1.5 sm:py-2 border-r border-base-muted text-xs sm:text-sm sticky left-0 z-30 bg-white">
                  이름
                </th>
                {days.map((day, index) => {
                  const dayOfWeek = getDayOfWeekKo(
                    wardDuty.year,
                    wardDuty.month,
                    day
                  );
                  const isHolidayDate = isHoliday(
                    wardDuty.year,
                    wardDuty.month,
                    day
                  );
                  return (
                    <th
                      key={day}
                      className={`px-0.5 sm:px-1 py-1.5 sm:py-2 border-r border-base-muted font-normal bg-white
                        ${index === days.length - 1 ? '' : 'border-r'} 
                        ${isHolidayDate || dayOfWeek === '일' ? 'text-red-500' : dayOfWeek === '토' ? 'text-blue-500' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`text-xs sm:text-sm ${
                            isHolidayDate || dayOfWeek === '일'
                              ? 'text-red-500'
                              : dayOfWeek === '토'
                                ? 'text-blue-500'
                                : ''
                          }`}
                        >
                          {day}
                        </span>
                        <span
                          className={`text-[10px] sm:text-xs ${
                            isHolidayDate || dayOfWeek === '일'
                              ? 'text-red-500'
                              : dayOfWeek === '토'
                                ? 'text-blue-500'
                                : 'text-gray-400'
                          }`}
                        >
                          {dayOfWeek}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {wardDuty.duty.map((member) => (
                <tr key={member.memberId}>
                  <td className="pl-1 sm:pl-1.5 lg:pl-2 pr-1 sm:pr-1.5 lg:pr-2 py-1.5 sm:py-2 font-medium border-r border-b border-base-muted text-center sticky left-0 bg-white z-10">
                    <div className="bg-base-muted-30 px-1 sm:px-1.5 lg:px-2 py-1">
                      {member.name.length > 12 ? (
                        <span className="block text-[0.6rem] lg:text-[0.65rem] leading-tight">
                          {member.name.split(' ').map((part, i) => (
                            <span key={i} className="block truncate">
                              {part}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span
                          className={`block truncate ${
                            member.name.length > 8
                              ? 'text-[0.6rem] lg:text-[0.65rem]'
                              : member.name.length > 6
                                ? 'text-[0.65rem] lg:text-xs'
                                : 'text-xs lg:text-sm'
                          }`}
                        >
                          {member.name}
                        </span>
                      )}
                    </div>
                  </td>
                  {member.shifts.split('').map((shift, index) => {
                    const dayNumber = index + 1;
                    return (
                      <td
                        key={index}
                        className={`px-1 py-1.5 text-center border-r border-b border-base-muted align-middle
													${index === member.shifts.length - 1 ? '' : 'border-r'}
													${isWeekendDay(wardDuty.year, wardDuty.month, dayNumber) ? 'bg-base-muted-30' : ''}
												`}
                      >
                        <div className="flex justify-center items-center">
                          <DutyBadgeEng
                            type={
                              (shift === 'X' ? 'X' : shift) as
                                | 'D'
                                | 'E'
                                | 'N'
                                | 'O'
                                | 'X'
                                | 'M'
                            }
                            variant="letter"
                            size="sm"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isReqModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsReqModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ReqShiftModal onClose={() => setIsReqModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamShiftTable;
