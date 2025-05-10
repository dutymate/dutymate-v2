import { useState } from 'react';
import { FaCog, FaUserPlus } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import DateSuggestionModal from '@/components/organisms/Group/DateSuggestionModal';
import ShareDateModal from '@/components/organisms/Group/ShareDateModal';
import InviteMemberModal from '@/components/organisms/Group/InviteMemberModal';
import useMediaQuery from '@/hooks/useMediaQuery';
import DutyBadgeEng from '@/components/atoms/DutyBadgeEng';

export const members = [
  { name: '임태호', isLeader: true },
  { name: '김서현' },
  { name: '김현진' },
  { name: '이재현' },
  { name: '한종우' },
  { name: '김민성' },
];

const groups = [
  {
    id: 1,
    name: 'A202 병동 친구들',
    desc: '간단한 병동 소개멘트',
    count: 6,
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
  {
    id: 2,
    name: '서울대 간호19 동기들',
    desc: '간단한 병동 소개멘트',
    count: 6,
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
  },
];

const generateMonthData = () => {
  const daysInMonth = 31;
  const data = [];

  const firstDayOfMonth = new Date(2025, 4, 1).getDay();
  const lastDayPrevMonth = new Date(2025, 4, 0).getDate();

  for (let i = 0; i < firstDayOfMonth; i++) {
    const day = lastDayPrevMonth - firstDayOfMonth + i + 1;
    data.push({
      date: day,
      isPrevMonth: true,
      duties: members.map((member: { name: string; isLeader?: boolean }) => {
        const dutyType = ['D', 'E', 'N', 'D', 'O', 'D'][
          members.indexOf(member) % 6
        ];
        return { member, duty: dutyType };
      }),
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    data.push({
      date: i,
      isCurrentMonth: true,
      duties: members.map((member: { name: string; isLeader?: boolean }) => {
        const dutyType = ['D', 'E', 'N', 'D', 'O', 'D'][
          members.indexOf(member) % 6
        ];
        return { member, duty: dutyType };
      }),
    });
  }

  const remainingDays = 7 - (data.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      data.push({
        date: i,
        isNextMonth: true,
        duties: members.map((member: { name: string; isLeader?: boolean }) => {
          const dutyType = ['D', 'E', 'N', 'D', 'O', 'D'][
            members.indexOf(member) % 6
          ];
          return { member, duty: dutyType };
        }),
      });
    }
  }

  return data;
};

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [sortByName, setSortByName] = useState(true);
  const group = groups.find((g) => String(g.id) === String(groupId));
  const monthData = generateMonthData();
  const [modalStep, setModalStep] = useState<
    'none' | 'check' | 'date' | 'share'
  >('none');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // 멤버 배열 및 선택 상태 선언
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.name)
  );

  // 정렬된 멤버 목록 생성
  const sortedMembers = [...members].sort((a, b) => {
    if (sortByName) {
      return a.name.localeCompare(b.name, 'ko');
    } else {
      // 근무순 정렬 (D > M > E > N > O)
      const dutyOrder = { D: 0, M: 1, E: 2, N: 3, O: 4 };
      const getDuty = (member: typeof a) => {
        const duty =
          monthData[0]?.duties.find((d) => d.member.name === member.name)
            ?.duty || '';
        return dutyOrder[duty as keyof typeof dutyOrder] ?? 5;
      };
      return getDuty(a) - getDuty(b);
    }
  });

  if (!group) return <div className="p-4">그룹을 찾을 수 없습니다.</div>;

  const weeks = [];
  for (let i = 0; i < monthData.length; i += 7) {
    weeks.push(monthData.slice(i, i + 7));
  }

  return (
    <GroupLayout
      title="함께 보는 근무표"
      subtitle="모두의 스케줄을 한눈에 확인하세요"
    >
      <div className="space-y-3">
        {/* ← 목록으로 버튼 (GroupMemberPage와 동일한 위치/스타일) */}
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
                  {group.name}
                </span>
                <FaCog
                  className="text-gray-400 cursor-pointer text-lg md:text-2xl ml-2 md:ml-4 sm:text-base"
                  onClick={() => navigate(`/group/${groupId}/member`)}
                />
              </div>
              <div className="text-gray-400 text-xs md:text-base">
                {group.desc}
              </div>
            </div>
            <button
              className="flex items-center border border-primary text-primary rounded px-3 py-1 text-sm md:text-base md:px-4 md:py-2 font-semibold bg-white hover:bg-primary-50 max-[639px]:px-2 max-[639px]:py-0.5 max-[639px]:text-[0.65rem] cursor-pointer"
              type="button"
              onClick={() => setInviteModalOpen(true)}
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
              aria-label="이전달"
            >
              <IoIosArrowBack className="text-xl md:text-3xl sm:text-base max-[639px]:text-[0.9rem]" />
            </button>
            <span className="font-semibold text-lg md:text-2xl sm:text-base max-[639px]:text-[0.9rem]">
              2025년 <span className="ml-1">5월</span>
            </span>
            <button
              className="p-1 text-lg md:text-3xl sm:p-0.5 sm:text-base max-[639px]:text-[0.9rem]"
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
                onClick={() => setSortByName(true)}
              >
                이름순
              </span>
              <span className="mx-1 text-gray-300 text-xs md:text-base">|</span>
              <span
                className={`cursor-pointer px-2 transition font-bold ${!sortByName ? 'text-gray-700' : 'text-gray-400'}`}
                onClick={() => setSortByName(false)}
              >
                근무순
              </span>
            </div>
            <button
              className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white px-6 py-2 rounded-full text-base md:text-xl font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all border-0 outline-none sm:px-4 sm:py-1.5 sm:text-sm max-[639px]:px-2 max-[639px]:py-1 max-[639px]:text-xs tracking-wide"
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

          {/* 캘린더 표 - 한 칸에 멤버별 듀티 여러 줄 */}
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
                          {sortedMembers.map((member) => {
                            const dutyInfo = day.duties.find(
                              (du) => du.member.name === member.name
                            );
                            const duty = dutyInfo ? dutyInfo.duty : '';
                            return (
                              <div
                                key={member.name}
                                className="flex items-center gap-1 w-full px-1"
                              >
                                <span
                                  className={`text-[11px] md:text-base font-semibold ${
                                    day.isPrevMonth || day.isNextMonth
                                      ? 'text-gray-300'
                                      : 'text-gray-600'
                                  } ${isMobile ? 'truncate max-w-[48px]' : ''} flex-1`}
                                >
                                  {member.name}
                                </span>
                                <div
                                  className={`flex-shrink-0 ${day.isPrevMonth || day.isNextMonth ? 'opacity-40' : ''}`}
                                >
                                  <DutyBadgeEng
                                    type={duty as 'D' | 'E' | 'N' | 'O' | 'M'}
                                    size="xs"
                                    variant="letter"
                                    useSmallText
                                  />
                                </div>
                              </div>
                            );
                          })}
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
      {/* 모달 플로우: 한 번에 하나만 렌더 */}
      {modalStep === 'check' && (
        <CheckMemberModal
          open
          onClose={() => setModalStep('none')}
          members={members}
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
        onInvite={(email) => {
          console.log('Invite:', email);
          setInviteModalOpen(false);
        }}
      />
    </GroupLayout>
  );
};

export default GroupDetailPage;
