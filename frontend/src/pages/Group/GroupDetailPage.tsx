import React, { useState } from 'react';
import { FaCog, FaUserPlus } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import DateSuggestionModal from '@/components/organisms/Group/DateSuggestionModal';

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
    desc: '간단한 병동 소개멘트 간단 병동 소개 멘트 간단한 병동',
    count: 6,
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
  {
    id: 2,
    name: '서울대 간호19 동기들',
    desc: '간단한 병동 소개멘트 간단 병동 소개 멘트 간단한 병동',
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

const dutyColors = {
  D: 'bg-duty-day-bg text-duty-day-dark',
  E: 'bg-duty-evening-bg text-duty-evening-dark',
  N: 'bg-duty-night-bg text-duty-night-dark',
  O: 'bg-duty-off-bg text-duty-off-dark',
};

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [sortByName, setSortByName] = useState(true);
  const group = groups.find((g) => String(g.id) === String(groupId));
  const monthData = generateMonthData();
  const [checkMemberOpen, setCheckMemberOpen] = useState(false);
  const [dateSuggestionOpen, setDateSuggestionOpen] = useState(false);

  // 멤버 배열 및 선택 상태 선언
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.name)
  );

  if (!group) return <div className="p-4">그룹을 찾을 수 없습니다.</div>;

  const weeks = [];
  for (let i = 0; i < monthData.length; i += 7) {
    weeks.push(monthData.slice(i, i + 7));
  }

  return (
    <GroupLayout>
      <div className="p-4 bg-base-background min-h-screen">
        {/* 상단: 그룹명, 설정, 초대 */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="mr-2 text-gray-500"
              >
                <IoIosArrowBack size={22} />
              </button>
              <span className="text-xl font-bold">{group.name}</span>
              <FaCog
                className="text-gray-400 cursor-pointer"
                onClick={() => navigate(`/group/${groupId}/member`)}
              />
            </div>
            <div className="text-gray-400 text-xs">{group.desc}</div>
          </div>
          <button
            className="flex items-center border border-primary text-primary rounded px-2 py-1 text-xs font-semibold bg-white hover:bg-primary-50"
            onClick={() => setCheckMemberOpen(true)}
          >
            <FaUserPlus className="mr-1" /> 친구 초대하기
          </button>
        </div>

        {/* 연도/월, 이전/다음달 */}
        <div className="flex items-center justify-center my-2 gap-4">
          <button className="p-1" aria-label="이전달">
            <IoIosArrowBack size={22} />
          </button>
          <span className="font-semibold text-lg">2025년 5월</span>
          <button className="p-1" aria-label="다음달">
            <IoIosArrowForward size={22} />
          </button>
        </div>

        {/* 이름순/근무순, 약속 날짜 정하기 */}
        <div className="flex gap-2 mb-2 items-center">
          <button
            className={`px-3 py-1 rounded-full text-sm border ${sortByName ? 'border-primary text-primary bg-white' : 'border-gray-300 text-gray-500 bg-white'} font-semibold`}
            onClick={() => setSortByName(true)}
          >
            이름순
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm border ${!sortByName ? 'border-primary text-primary bg-white' : 'border-gray-300 text-gray-500 bg-white'} font-semibold`}
            onClick={() => setSortByName(false)}
          >
            근무순
          </button>
          <button
            className="ml-auto bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold"
            onClick={() => setDateSuggestionOpen(true)}
          >
            약속 날짜 정하기
          </button>
        </div>

        {/* 근무표 */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="text-xs text-red-500 font-normal w-1/7 text-center p-1">
                  SUN
                </th>
                <th className="text-xs text-gray-700 font-normal w-1/7 text-center p-1">
                  MON
                </th>
                <th className="text-xs text-gray-700 font-normal w-1/7 text-center p-1">
                  TUE
                </th>
                <th className="text-xs text-gray-700 font-normal w-1/7 text-center p-1">
                  WED
                </th>
                <th className="text-xs text-gray-700 font-normal w-1/7 text-center p-1">
                  THU
                </th>
                <th className="text-xs text-gray-700 font-normal w-1/7 text-center p-1">
                  FRI
                </th>
                <th className="text-xs text-purple-500 font-normal w-1/7 text-center p-1">
                  SAT
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIndex) => (
                <React.Fragment key={`week-${weekIndex}`}>
                  {/* Date row */}
                  <tr>
                    {week.map((day, dayIndex) => (
                      <td
                        key={`date-${weekIndex}-${dayIndex}`}
                        className={`text-xs p-1 text-center ${
                          day.isPrevMonth || day.isNextMonth
                            ? 'text-gray-400'
                            : dayIndex === 0
                              ? 'text-red-500'
                              : dayIndex === 6
                                ? 'text-purple-500'
                                : 'text-gray-700'
                        }`}
                      >
                        {day.date}
                      </td>
                    ))}
                  </tr>

                  {/* Duty rows for each member */}
                  {members.map((member) => (
                    <tr key={`duties-${weekIndex}-${member.name}`}>
                      {week.map((day, dayIndex) => {
                        const dutyInfo = day.duties.find(
                          (d) => d.member.name === member.name
                        );
                        const duty = dutyInfo ? dutyInfo.duty : '';

                        return (
                          <td
                            key={`duty-${weekIndex}-${dayIndex}-${member.name}`}
                            className="p-1 text-center border border-gray-100"
                          >
                            <div className="flex items-center">
                              <span className="text-xs w-1/2 text-right pr-1">
                                {member.name}
                              </span>
                              <span
                                className={`text-xs w-1/2 rounded-sm px-1 ${dutyColors[duty as keyof typeof dutyColors] || ''}`}
                              >
                                {duty}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <CheckMemberModal
        open={checkMemberOpen}
        onClose={() => setCheckMemberOpen(false)}
        members={members}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
      />
      <DateSuggestionModal
        open={dateSuggestionOpen}
        onClose={() => setDateSuggestionOpen(false)}
      />
    </GroupLayout>
  );
};

export default GroupDetailPage;
