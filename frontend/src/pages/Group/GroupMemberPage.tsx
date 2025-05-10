// import React from 'react';
import { FaCrown, FaUserPlus } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import { useState } from 'react';

interface Member {
  name: string;
  isLeader?: boolean;
  joinedAt: string;
}

const INITIAL_GROUPS = [
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

const GroupMemberPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const group = INITIAL_GROUPS.find((g) => String(g.id) === String(groupId));
  const [checkMemberOpen, setCheckMemberOpen] = useState(false);

  if (!group) return <div>그룹을 찾을 수 없습니다.</div>;

  const members: Member[] = [
    { name: '임태호', isLeader: true, joinedAt: '2025-05-05' },
    { name: '김서현', joinedAt: '2025-05-05' },
    { name: '김현진', joinedAt: '2025-05-05' },
    { name: '이재현', joinedAt: '2025-05-05' },
    { name: '한종우', joinedAt: '2025-05-05' },
    { name: '김민성', joinedAt: '2025-05-05' },
  ];
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.name)
  );

  const handleKick = (name: string) => {
    // 내보내기 로직
    console.log('Kick member:', name);
  };

  // const handleInvite = () => {
  //   // 초대 로직
  //   console.log('Invite members');
  // };

  const handleLeave = () => {
    // 그룹 나가기 로직
    console.log('Leave group');
    navigate(-1);
  };

  return (
    <GroupLayout>
      <div className="space-y-3">
        {/* 상단: 그룹 정보 */}
        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={group.img}
              alt={group.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{group.name}</span>
                <span className="text-gray-500 text-sm">👥 {group.count}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{group.desc}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="flex items-center border border-primary text-primary rounded px-2 py-1 text-xs font-semibold bg-white hover:bg-primary-50"
              onClick={() => setCheckMemberOpen(true)}
            >
              <FaUserPlus className="mr-1" /> 친구 초대하기
            </button>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex font-semibold text-gray-500 mb-3">
            <div className="w-1/3">이름</div>
            <div className="w-1/3">가입 날짜</div>
            <div className="w-1/3"></div>
          </div>
          {members.map((m) => (
            <div key={m.name} className="flex items-center mb-2">
              <div className="w-1/3 flex items-center">
                {m.isLeader ? (
                  <span className="flex items-center bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-lg text-sm">
                    <FaCrown className="mr-1 text-yellow-400" /> {m.name}
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                    {m.name}
                  </span>
                )}
              </div>
              <div className="w-1/3 text-center text-gray-500 text-sm">
                {m.joinedAt}
              </div>
              <div className="w-1/3 flex justify-end">
                {!m.isLeader && (
                  <button
                    className="text-gray-500 text-sm hover:text-red-500"
                    onClick={() => handleKick(m.name)}
                  >
                    내보내기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 그룹 나가기 버튼 */}
        <button
          className="w-full bg-white text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
          onClick={handleLeave}
        >
          그룹 나가기
        </button>
      </div>
      <CheckMemberModal
        open={checkMemberOpen}
        onClose={() => setCheckMemberOpen(false)}
        members={members}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
      />
    </GroupLayout>
  );
};

export default GroupMemberPage;
