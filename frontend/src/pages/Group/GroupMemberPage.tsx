// import React from 'react';
import { FaCrown, FaUserPlus } from 'react-icons/fa';
import { HiOutlinePencil } from 'react-icons/hi2';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import InviteMemberModal from '@/components/organisms/Group/InviteMemberModal';
import ExitGroupModal from '@/components/organisms/Group/ExitGroupModal';
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

const GroupMemberPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const group = INITIAL_GROUPS.find((g) => String(g.id) === String(groupId));
  const [checkMemberOpen, setCheckMemberOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState(group);

  if (!groupInfo) return <div>그룹을 찾을 수 없습니다.</div>;

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

  const handleEditGroup = (data: {
    name: string;
    desc: string;
    img: string;
  }) => {
    setGroupInfo({ ...groupInfo, ...data });
    setEditModalOpen(false);
    // 실제로는 서버에 PATCH 요청 등 필요
  };

  const handleLeave = () => {
    // 그룹 나가기 로직
    console.log('Leave group');
    navigate(-1);
  };

  return (
    <GroupLayout
      title="그룹 관리"
      subtitle="소속 인원과 정보를 관리할 수 있습니다."
    >
      <div className="space-y-3">
        {/* ← 목록으로 버튼 */}
        <div className="flex mb-3">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground text-sm sm:text-base"
          >
            ← 목록으로
          </button>
        </div>
        {/* 상단: 그룹 정보 */}
        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={groupInfo.img}
              alt={groupInfo.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg truncate">
                  {groupInfo.name}
                </span>
                <button
                  className="ml-1 p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setEditModalOpen(true)}
                  aria-label="그룹 수정"
                  type="button"
                >
                  <HiOutlinePencil className="text-gray-400 text-lg" />
                </button>
                <span className="text-gray-500 text-sm">
                  👥 {groupInfo.count}
                </span>
              </div>
              <div className="flex items-center w-full mt-1">
                <div className="text-xs md:text-base text-gray-400 truncate flex-1">
                  {groupInfo.desc}
                </div>
                <button
                  className="flex items-center border border-primary text-primary rounded px-2 py-1 text-xs md:text-base md:px-4 md:py-2 font-semibold bg-white hover:bg-primary-50 ml-2"
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                >
                  <FaUserPlus className="mr-1 md:text-base" /> 친구 초대
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-xl p-4 shadow border">
          {/* 헤더: 이름/가입날짜/내보내기 - 가운데 정렬 */}
          <div className="flex font-semibold text-gray-500 mb-3 justify-center text-center">
            <div className="w-1/3">이름</div>
            <div className="w-1/3">가입 날짜</div>
            <div className="w-1/3"></div>
          </div>
          {members.map((m) => (
            <div key={m.name} className="flex items-center mb-2">
              <div className="w-1/3 flex items-center md:pl-[1.5rem]">
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
              <div className="w-1/3 flex justify-end md:pr-[1.5rem]">
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
          type="button"
          onClick={() => setExitModalOpen(true)}
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
      <EditGroupModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onAddGroup={handleEditGroup}
        initialData={{
          name: groupInfo.name,
          desc: groupInfo.desc,
          img: groupInfo.img,
        }}
      />
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={(email) => {
          console.log('Invite:', email);
          setInviteModalOpen(false);
        }}
      />
      <ExitGroupModal
        open={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        isLeader={false}
        onExit={handleLeave}
      />
    </GroupLayout>
  );
};

export default GroupMemberPage;
