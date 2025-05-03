import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/atoms/Button';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import { Tooltip } from '@/components/atoms/Tooltip';
import ReqShiftModal from '@/components/organisms/ReqShiftModal';

import { dutyService } from '@/services/dutyService';
import { useLoadingStore } from '@/stores/loadingStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { TeamShiftTableDownload } from '@/utils/TeamShiftTableDownload';

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

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const TeamShiftTable = () => {
  const [wardDuty, setWardDuty] = useState<WardDuty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [currentDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const { userInfo } = useUserAuthStore();

  useEffect(() => {
    const fetchWardDuty = async () => {
      useLoadingStore.getState().setLoading(true);
      try {
        const data = await dutyService.getWardDuty(
          currentDate.year,
          currentDate.month
        );
        setWardDuty(data);
      } catch (error) {
        console.error('병동 근무표 조회 실패:', error);
        toast.error('병동 근무표를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
        useLoadingStore.getState().setLoading(false);
      }
    };

    fetchWardDuty();
  }, [currentDate]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!wardDuty) return null;

  // 해당 월의 실제 일수 계산
  const daysInMonth = new Date(wardDuty.year, wardDuty.month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 요일 계산 함수
  const getDayOfWeek = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return DAYS_OF_WEEK[date.getDay()];
  };

  // 주말 체크 함수
  const isWeekend = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
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

  const sortedDuty = wardDuty.duty.sort((a, b) => {
    // 먼저 role로 정렬 (HN이 위로)
    if (a.role === 'HN' && b.role !== 'HN') return -1;
    if (a.role !== 'HN' && b.role === 'HN') return 1;

    // role이 같은 경우 grade로 정렬 (내림차순)
    return b.grade - a.grade;
  });

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
          <div className="text-[0.9rem] lg:text-lg font-medium whitespace-nowrap">
            {wardDuty.year}년 {wardDuty.month}월
          </div>
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
      <div className="overflow-x-auto relative w-full max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-16rem)]">
        <div className="duty-table-content min-w-[640px] relative">
          <table className="w-full border-collapse">
            <colgroup>
              <col className="w-[3rem] sm:w-[4rem] lg:w-[5.5rem]" />
              {days.map((day) => (
                <col
                  key={`col-${day}`}
                  className={`w-[calc((100%-3rem)/31)] sm:w-[calc((100%-4rem)/31)] lg:w-[calc((100%-5.5rem)/31)] ${
                    isWeekend(wardDuty.year, wardDuty.month, day)
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
                {days.map((day, index) => (
                  <th
                    key={day}
                    className={`px-0.5 sm:px-1 py-1.5 sm:py-2 border-r border-base-muted font-normal bg-white
											${index === days.length - 1 ? '' : 'border-r'} 
											${
                        getDayOfWeek(wardDuty.year, wardDuty.month, day) ===
                        '일'
                          ? 'text-red-500'
                          : getDayOfWeek(wardDuty.year, wardDuty.month, day) ===
                              '토'
                            ? 'text-blue-500'
                            : ''
                      }
										`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`text-xs sm:text-sm ${
                          getDayOfWeek(wardDuty.year, wardDuty.month, day) ===
                          '일'
                            ? 'text-red-500'
                            : getDayOfWeek(
                                  wardDuty.year,
                                  wardDuty.month,
                                  day
                                ) === '토'
                              ? 'text-blue-500'
                              : ''
                        }`}
                      >
                        {day}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs ${
                          getDayOfWeek(wardDuty.year, wardDuty.month, day) ===
                          '일'
                            ? 'text-red-500'
                            : getDayOfWeek(
                                  wardDuty.year,
                                  wardDuty.month,
                                  day
                                ) === '토'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                        }`}
                      >
                        {getDayOfWeek(wardDuty.year, wardDuty.month, day)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDuty.map((member) => (
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
													${isWeekend(wardDuty.year, wardDuty.month, dayNumber) ? 'bg-base-muted-30' : ''}
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
