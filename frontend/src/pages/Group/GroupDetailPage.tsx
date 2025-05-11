import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import DateSuggestionModal from '@/components/organisms/Group/DateSuggestionModal';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import InviteMemberModal from '@/components/organisms/Group/InviteMemberModal';
import ShareDateModal from '@/components/organisms/Group/ShareDateModal';
import useMediaQuery from '@/hooks/useMediaQuery';
import { groupService } from '@/services/groupService';
import { useLoadingStore } from '@/stores/loadingStore';
import { DayInfo, DutyType, Group, ShiftMember } from '@/types/group';
import { useCallback, useEffect, useState } from 'react';
import { FaCog, FaUserPlus } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export interface InviteLinkResponse {
  inviteUrl: string;
  groupName: string;
}

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [sortByName, setSortByName] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalStep, setModalStep] = useState<
    'none' | 'check' | 'date' | 'share'
  >('none');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // const [dutyData, setDutyData] = useState<{
  //   year: number;
  //   month: number;
  //   shifts: string;
  //   prevShifts: string;
  //   nextShifts: string;
  // } | null>(null);
  const [groupMembers, setGroupMembers] = useState<ShiftMember[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');

  // fetchGroupData 함수를 useCallback으로 래핑하여 의존성 관리
  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      // 현재 연도와 월 구하기
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // 정렬 기준 전달 (이름순/근무순)
      const orderBy = sortByName ? 'name' : 'duty';

      const response = await groupService.getGroup(
        Number(groupId),
        year,
        month,
        orderBy
      );

      // 그룹 설정
      setGroup(response);

      // 백엔드에서 받은 멤버 리스트의 순서 그대로 사용
      if (response.shifts && response.shifts.length > 0) {
        // 배열 순서 그대로 가져오기
        const members = response.shifts[0].memberList.map((member) => ({
          memberId: member.memberId,
          name: member.name,
          duty: member.duty,
        }));

        setGroupMembers(members);
      }
    } catch (error) {
      console.error('Failed to fetch group data:', error);
      toast.error('그룹 정보를 불러오는데 실패했습니다.');
      navigate('/group');
    } finally {
      setLoading(false);
    }
  }, [groupId, currentMonth, sortByName, navigate]);

  // 초기 로딩 및 파라미터 변경 시 데이터 가져오기
  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // 멤버 배열 및 선택 상태 선언
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // 선택된 멤버 업데이트
  useEffect(() => {
    if (groupMembers.length > 0) {
      setSelectedMembers(groupMembers.map((m) => m.name));
    }
  }, [groupMembers]);

  // useEffect to update the loading state
  useEffect(() => {
    useLoadingStore.setState({ isLoading: loading });
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-10">
        <PageLoadingSpinner />
      </div>
    );
  }
  if (!group) return <div className="p-4">그룹을 찾을 수 없습니다.</div>;

  // 월 변경 핸들러 수정 - 정렬 기준 초기화 추가
  const handlePrevMonth = () => {
    // 이전 달로 변경
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
    // 정렬 기준 이름순으로 초기화
    setSortByName(true);
    // useEffect에서 currentMonth, sortByName 변경 감지하여 fetchGroupData 호출
  };

  const handleNextMonth = () => {
    // 다음 달로 변경
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
    // 정렬 기준 이름순으로 초기화
    setSortByName(true);
    // useEffect에서 currentMonth, sortByName 변경 감지하여 fetchGroupData 호출
  };

  // 정렬 변경 핸들러
  const handleSortToggle = (byName: boolean) => {
    setSortByName(byName);
    // useEffect에서 sortByName 변경 감지하여 fetchGroupData 호출
  };

  // 듀티 데이터를 기반으로 캘린더 데이터 생성
  const generateMonthData = (): DayInfo[] => {
    if (!group || !group.shifts || group.shifts.length === 0) {
      return [];
    }

    // 현재 월의 일수 계산
    const year = parseInt(group.shifts[0].date.substring(0, 4));
    const month = parseInt(group.shifts[0].date.substring(5, 7)) - 1; // 0-11 형식
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 첫 날의 요일 (0: 일요일, 6: 토요일)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // 이전 달의 마지막 날짜
    const lastDayPrevMonth = new Date(year, month, 0).getDate();

    const data: DayInfo[] = [];

    // 이전 달의 날짜 추가
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = lastDayPrevMonth - firstDayOfMonth + i + 1;
      data.push({
        date: day,
        isPrevMonth: true,
        duties: [], // 이전 달은 빈 배열로 설정
      });
    }

    // 현재 달의 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayShift = group.shifts.find((shift) => shift.date === currentDate);

      if (dayShift) {
        // 해당 날짜의 멤버 리스트를 백엔드에서 받은 그대로 사용
        const duties = dayShift.memberList.map((member) => ({
          member: {
            memberId: member.memberId,
            name: member.name,
            duty: member.duty,
          },
          duty: member.duty,
        }));

        data.push({
          date: i,
          dateStr: currentDate,
          isCurrentMonth: true,
          duties,
        });
      } else {
        // 해당 날짜에 근무 정보가 없는 경우
        data.push({
          date: i,
          dateStr: currentDate,
          isCurrentMonth: true,
          duties: [], // 빈 배열로 설정
        });
      }
    }

    // 다음 달의 날짜 추가
    const remainingDays = 7 - (data.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        data.push({
          date: i,
          isNextMonth: true,
          duties: [], // 다음 달은 빈 배열로 설정
        });
      }
    }

    return data;
  };

  const monthData = generateMonthData();
  const weeks = [];
  for (let i = 0; i < monthData.length; i += 7) {
    weeks.push(monthData.slice(i, i + 7));
  }

  const handleInviteButton = async () => {
    const response = await groupService.createInvitationLink(Number(groupId));
    setInviteLink(response.inviteUrl);
    setInviteModalOpen(true);
  };

  return (
    <GroupLayout
      title="함께 보는 근무표"
      subtitle="모두의 스케줄을 한눈에 확인하세요"
    >
      <div className="space-y-3">
        {/* ← 목록으로 버튼 */}
        <div className="flex mb-3">
          <button
            onClick={() => navigate('/group')}
            className="text-foreground text-sm md:text-base px-3 py-1 sm:text-xs sm:px-2 sm:py-0.5"
          >
            ← 목록으로
          </button>
        </div>
        {/* 주요 컨텐츠를 흰색 네모 상자에 담기 */}
        <div className="bg-white rounded-xl shadow p-4">
          {/* 상단: 그룹명, 설정, 초대 */}
          <div className="flex items-center justify-between mb-1">
            <div className="lg:ml-4">
              <div className="flex items-center gap-2 sm:gap-1">
                <span className="text-lg md:text-2xl font-bold max-[639px]:text-base">
                  {group.groupName}
                </span>
                <FaCog
                  className="text-gray-400 cursor-pointer text-lg md:text-2xl ml-2 md:ml-4 sm:text-base"
                  onClick={() => navigate(`/group/${groupId}/member`)}
                />
              </div>
              <div className="text-gray-400 text-xs md:text-base">
                {group.groupDescription}
              </div>
            </div>
            <button
              className="flex items-center border border-primary text-primary rounded-lg px-3 py-1 text-sm md:text-base md:px-4 md:py-2 font-semibold bg-white hover:bg-primary-50 max-[639px]:px-2 max-[639px]:py-0.5 max-[639px]:text-[0.65rem] cursor-pointer"
              type="button"
              onClick={handleInviteButton}
            >
              <FaUserPlus className="mr-1 text-sm md:text-base max-[639px]:text-xs" />
              <span className="hidden md:inline">친구 초대</span>
              <span className="md:hidden">친구 초대</span>
            </button>
          </div>

          {/* 연도/월, 이전/다음달 */}
          <div className="flex items-center justify-center my-2 gap-4 md:gap-8 sm:gap-2">
            <button
              className="p-1 text-lg md:text-3xl sm:p-0.5 sm:text-base max-[639px]:text-[0.9rem]"
              onClick={handlePrevMonth}
              aria-label="이전달"
            >
              <IoIosArrowBack className="text-xl md:text-3xl sm:text-base max-[639px]:text-[0.9rem]" />
            </button>
            <span className="font-semibold text-lg md:text-2xl sm:text-base max-[639px]:text-[0.9rem]">
              {group && group.shifts && group.shifts.length > 0
                ? group.shifts[0].date.substring(0, 4)
                : new Date().getFullYear()}
              년{' '}
              <span className="ml-1">
                {group && group.shifts && group.shifts.length > 0
                  ? parseInt(group.shifts[0].date.substring(5, 7))
                  : new Date().getMonth() + 1}
                월
              </span>
            </span>
            <button
              className="p-1 text-lg md:text-3xl sm:p-0.5 sm:text-base max-[639px]:text-[0.9rem]"
              onClick={handleNextMonth}
              aria-label="다음달"
            >
              <IoIosArrowForward className="text-xl md:text-3xl sm:text-base max-[639px]:text-[0.9rem]" />
            </button>
          </div>

          {/* 이름순/근무순, 약속 날짜 정하기 */}
          <div className="flex gap-2 mb-2 items-center">
            <div className="flex items-center gap-0 text-gray-400 text-xs md:text-base font-medium select-none">
              <span
                className={`cursor-pointer px-2 transition font-bold ${sortByName ? 'text-gray-700' : 'text-gray-400'}`}
                onClick={() => handleSortToggle(true)}
              >
                이름순
              </span>
              <span className="mx-1 text-gray-300 text-xs md:text-base">|</span>
              <span
                className={`cursor-pointer px-2 transition font-bold ${!sortByName ? 'text-gray-700' : 'text-gray-400'}`}
                onClick={() => handleSortToggle(false)}
              >
                근무순
              </span>
            </div>
            <button
              className="ml-auto flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-base md:text-xl font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all border-0 outline-none sm:px-4 sm:py-1.5 sm:text-sm max-[639px]:px-2 max-[639px]:py-1 max-[639px]:text-xs tracking-wide"
              onClick={() => setModalStep('check')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 md:w-6 md:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 19.5h15a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75h-15A.75.75 0 003.75 7.5v11.25c0 .414.336.75.75.75z"
                />
              </svg>
              약속 잡기
            </button>
          </div>

          {/* 캘린더 표 */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-xs md:text-base text-red-500 font-normal w-1/7 text-center p-1">
                    SUN
                  </th>
                  <th className="text-xs md:text-base text-gray-700 font-normal w-1/7 text-center p-1">
                    MON
                  </th>
                  <th className="text-xs md:text-base text-gray-700 font-normal w-1/7 text-center p-1">
                    TUE
                  </th>
                  <th className="text-xs md:text-base text-gray-700 font-normal w-1/7 text-center p-1">
                    WED
                  </th>
                  <th className="text-xs md:text-base text-gray-700 font-normal w-1/7 text-center p-1">
                    THU
                  </th>
                  <th className="text-xs md:text-base text-gray-700 font-normal w-1/7 text-center p-1">
                    FRI
                  </th>
                  <th className="text-xs md:text-base text-purple-500 font-normal w-1/7 text-center p-1">
                    SAT
                  </th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIndex) => (
                  <tr key={`week-${weekIndex}`}>
                    {week.map((day, dayIndex) => (
                      <td
                        key={`date-${weekIndex}-${dayIndex}`}
                        className={`align-top text-xs p-1 text-center border border-gray-100 ${
                          day.isPrevMonth || day.isNextMonth
                            ? 'text-gray-400 bg-gray-50'
                            : dayIndex === 0
                              ? 'text-red-500'
                              : dayIndex === 6
                                ? 'text-purple-500'
                                : 'text-gray-700'
                        } ${isMobile ? 'min-w-[70px] p-1' : 'min-w-[90px] p-2'}`}
                        style={{ verticalAlign: 'top' }}
                      >
                        <div className="font-bold mb-1 text-xs text-gray-400">
                          {day.date}
                        </div>
                        <div className="flex flex-col gap-0.5 items-start">
                          {day.duties.map((dutyInfo, index) => (
                            <div
                              key={`${day.date}-${dutyInfo.member.memberId || index}`}
                              className="flex items-center justify-between w-full px-1"
                            >
                              <span
                                className={`text-[11px] md:text-base font-semibold ${
                                  day.isPrevMonth || day.isNextMonth
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                                } ${isMobile ? 'truncate max-w-[48px]' : ''} text-left`}
                              >
                                {dutyInfo.member.name}
                              </span>
                              <div
                                className={`flex-shrink-0 ${dutyInfo.duty ? '' : 'invisible'} ${day.isPrevMonth || day.isNextMonth ? 'opacity-40' : ''}`}
                              >
                                <DutyBadgeEng
                                  type={dutyInfo.duty as DutyType}
                                  size="xs"
                                  variant="letter"
                                  useSmallText
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 모달 플로우 */}
      {modalStep === 'check' && (
        <CheckMemberModal
          open
          onClose={() => setModalStep('none')}
          members={groupMembers}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          onNext={() => setModalStep('date')}
        />
      )}
      {modalStep === 'date' && (
        <DateSuggestionModal
          open
          onClose={() => setModalStep('none')}
          onShareClick={() => setModalStep('share')}
        />
      )}
      {modalStep === 'share' && (
        <ShareDateModal open onClose={() => setModalStep('none')} />
      )}
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        inviteLink={inviteLink}
        groupName={group.groupName}
      />
    </GroupLayout>
  );
};

export default GroupDetailPage;
