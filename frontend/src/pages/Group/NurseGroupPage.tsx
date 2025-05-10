import { useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import { PiPlusCircle } from 'react-icons/pi';
import { dutyService } from '@/services/dutyService';

export type Group = {
  groupId: number;
  groupName: string;
  groupDescription: string;
  groupMemberCount: number;
  groupImg: string;
  dutyData?: {
    year: number;
    month: number;
    shifts: string;
    prevShifts: string;
    nextShifts: string;
  };
};

export const INITIAL_GROUPS: Group[] = [
  {
    groupId: 1,
    groupName: 'A202 병동 친구들',
    groupDescription: '간단한 병동 소개멘트',
    groupMemberCount: 6,
    groupImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  },
  {
    groupId: 2,
    groupName: '서울대 간호19 동기들',
    groupDescription: '간단한 병동 소개멘트',
    groupMemberCount: 6,
    groupImg: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
  },
];

// 전역 상태로 사용할 groups 배열
export const groups: Group[] = [...INITIAL_GROUPS];

const NurseGroupPage = () => {
  const navigate = useNavigate();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [localGroups, setLocalGroups] = useState<Group[]>(groups);

  const handleAddGroup = async (group: {
    groupName: string;
    groupDescription: string;
    groupImg: string;
  }) => {
    try {
      const today = new Date();
      const dutyData = await dutyService.getMyDuty(
        today.getFullYear(),
        today.getMonth() + 1
      );

      const newGroup = {
        ...group,
        groupId: Date.now(),
        groupMemberCount: 1,
        dutyData,
      };

      groups.push(newGroup);
      setLocalGroups([...groups]);
      navigate(`/group/${newGroup.groupId}`);
    } catch (error) {
      console.error('Failed to fetch duty data:', error);
      const newGroup = { ...group, groupId: Date.now(), groupMemberCount: 1 };
      groups.push(newGroup);
      setLocalGroups([...groups]);
      navigate(`/group/${newGroup.groupId}`);
    }
  };

  // 그룹 멤버 강제 퇴장 시 그룹 인원수 감소 함수 추가
  // const handleRemoveMemberFromGroup = (groupId: number, memberName: string) => {
  //   // 1. 전역 groups 배열에서 해당 그룹의 인원수 감소
  //   const idx = groups.findIndex((g) => g.groupId === groupId);
  //   if (idx !== -1) {
  //     groups[idx] = {
  //       ...groups[idx],
  //       groupMemberCount: Math.max(0, groups[idx].groupMemberCount - 1),
  //     };
  //   }
  //   // 2. localGroups도 동기화
  //   setLocalGroups((prev) =>
  //     prev.map((g) =>
  //       g.groupId === groupId
  //         ? { ...g, groupMemberCount: Math.max(0, g.groupMemberCount - 1) }
  //         : g
  //     )
  //   );
  // };

  return (
    <GroupLayout
      title="친구 찾기"
      subtitle="그룹을 만들어 친구들끼리 근무표를 공유해보세요"
    >
      {/* 그룹 목록 화면 */}
      <div className="space-y-3">
        {localGroups.map((g) => (
          <div
            key={g.groupId}
            className="flex items-center bg-white rounded-xl p-3 shadow border cursor-pointer"
            onClick={() => navigate(`/group/${g.groupId}`)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base">{g.groupName}</span>
                <span className="flex items-center text-gray-500 text-sm ml-2">
                  <FaUserFriends className="mr-1" /> {g.groupMemberCount}
                </span>
              </div>
              <div className="text-gray-500 text-sm">{g.groupDescription}</div>
            </div>
            <img
              src={g.groupImg}
              alt={g.groupName}
              className="w-16 h-16 rounded-lg object-cover ml-3"
            />
          </div>
        ))}
        <button
          className="w-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 py-6 text-gray-600 hover:bg-gray-100"
          onClick={() => setAddGroupOpen(true)}
        >
          <PiPlusCircle className="text-2xl mb-1" />
          <span>그룹 만들기</span>
        </button>
      </div>
      <EditGroupModal
        open={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onAddGroup={handleAddGroup}
      />
    </GroupLayout>
  );
};

export default NurseGroupPage;
