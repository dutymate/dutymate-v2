// import React from 'react';
import { FaCrown, FaUserPlus } from 'react-icons/fa';
import { HiOutlinePencil } from 'react-icons/hi2';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import InviteMemberModal from '@/components/organisms/Group/InviteMemberModal';
import ExitGroupModal from '@/components/organisms/Group/ExitGroupModal';
import RemoveMemberModal from '@/components/organisms/Group/RemoveMemberModal';
import { useState } from 'react';
import { groups } from './NurseGroupPage';
import useUserAuthStore from '@/stores/userAuthStore';

interface Member {
  memberId: number;
  name: string;
  isLeader?: boolean;
  createdAt: string;
}

const GroupMemberPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useUserAuthStore();
  const group = groups.find((g) => String(g.groupId) === String(groupId));
  const [checkMemberOpen, setCheckMemberOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState(group);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removeTargetName, setRemoveTargetName] = useState<string | undefined>(
    undefined
  );

  if (!groupInfo) return <div>그룹을 찾을 수 없습니다.</div>;

  const members: Member[] =
    groupInfo.groupMemberCount === 1
      ? [
          {
            memberId: 1,
            name: userInfo?.name || '나',
            isLeader: true,
            createdAt: new Date().toISOString().slice(0, 10),
          },
        ]
      : [
          {
            memberId: 1,
            name: '임태호',
            isLeader: true,
            createdAt: '2025-05-05',
          },
          { memberId: 2, name: '김서현', createdAt: '2025-05-05' },
          { memberId: 3, name: '김현진', createdAt: '2025-05-05' },
          { memberId: 4, name: '이재현', createdAt: '2025-05-05' },
          { memberId: 5, name: '한종우', createdAt: '2025-05-05' },
          { memberId: 6, name: '김민성', createdAt: '2025-05-05' },
        ];

  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.name)
  );

  const [localMembers, setLocalMembers] = useState<Member[]>(members);

  const handleKick = (name: string) => {
    setRemoveTargetName(name);
    setRemoveModalOpen(true);
  };

  const handleRemoveMember = () => {
    if (!removeTargetName || !groupInfo) return;
    // 1. 멤버 삭제
    const updatedMembers = members.filter((m) => m.name !== removeTargetName);
    // 2. 인원수 감소
    const updatedGroupInfo = {
      ...groupInfo,
      groupMemberCount: groupInfo.groupMemberCount - 1,
    };
    setGroupInfo(updatedGroupInfo);
    // 3. 전역 groups 배열 동기화
    const idx = groups.findIndex((g) => g.groupId === groupInfo.groupId);
    if (idx !== -1) {
      groups[idx] = {
        ...groups[idx],
        groupMemberCount: updatedGroupInfo.groupMemberCount,
      };
    }
    // 4. members 배열 동기화 (로컬)
    setLocalMembers(updatedMembers);
    setRemoveModalOpen(false);
    setRemoveTargetName(undefined);
  };

  const handleEditGroup = (data: {
    groupName: string;
    groupDescription: string;
    groupImg: string;
  }) => {
    setGroupInfo({ ...groupInfo, ...data });
    const idx = groups.findIndex((g) => g.groupId === groupInfo.groupId);
    if (idx !== -1) {
      groups[idx] = { ...groups[idx], ...data };
    }
    setEditModalOpen(false);
  };

  const handleLeave = () => {
    if (groupInfo) {
      const idx = groups.findIndex((g) => g.groupId === groupInfo.groupId);
      if (idx !== -1) {
        groups.splice(idx, 1);
      }
    }
    navigate('/group');
  };

  return (
    <GroupLayout
      title="그룹 관리"
      subtitle="소속 인원과 정보를 관리할 수 있습니다."
    >
      <div className="space-y-3">
        <div className="flex mb-3">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground text-sm sm:text-base"
          >
            ← 목록으로
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={groupInfo.groupImg}
              alt={groupInfo.groupName}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg truncate">
                  {groupInfo.groupName}
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
                  👥 {groupInfo.groupMemberCount}
                </span>
              </div>
              <div className="flex items-center w-full mt-1">
                <div className="text-xs md:text-base text-gray-400 truncate flex-1">
                  {groupInfo.groupDescription}
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

        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex font-semibold text-gray-500 mb-3 justify-center text-center">
            <div className="w-1/3">이름</div>
            <div className="w-1/3">가입 날짜</div>
            <div className="w-1/3"></div>
          </div>
          {localMembers.map((m) => (
            <div key={m.memberId} className="flex items-center mb-2">
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
                {m.createdAt}
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
          groupName: groupInfo.groupName,
          groupDescription: groupInfo.groupDescription,
          groupImg: groupInfo.groupImg,
        }}
      />
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
      <ExitGroupModal
        open={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        isLeader={false}
        onExit={handleLeave}
      />
      <RemoveMemberModal
        open={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        memberName={removeTargetName}
        onRemove={handleRemoveMember}
      />
    </GroupLayout>
  );
};

export default GroupMemberPage;
