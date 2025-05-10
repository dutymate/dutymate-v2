import { useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import { PiPlusCircle } from 'react-icons/pi';
import { dutyService } from '@/services/dutyService';

export type Group = {
  id: number;
  name: string;
  desc: string;
  count: number;
  img: string;
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

// 전역 상태로 사용할 groups 배열
export const groups: Group[] = [...INITIAL_GROUPS];

const NurseGroupPage = () => {
  const navigate = useNavigate();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [localGroups, setLocalGroups] = useState<Group[]>(groups);

  const handleAddGroup = async (group: {
    name: string;
    desc: string;
    img: string;
  }) => {
    try {
      // 현재 날짜의 듀티 데이터 가져오기
      const today = new Date();
      const dutyData = await dutyService.getMyDuty(
        today.getFullYear(),
        today.getMonth() + 1
      );

      const newGroup = {
        ...group,
        id: Date.now(),
        count: 1,
        dutyData,
      };

      groups.push(newGroup); // 전역 상태 업데이트
      setLocalGroups([...groups]); // 로컬 상태 업데이트
      navigate(`/group/${newGroup.id}`);
    } catch (error) {
      console.error('Failed to fetch duty data:', error);
      // 듀티 데이터를 가져오지 못해도 그룹은 생성
      const newGroup = { ...group, id: Date.now(), count: 1 };
      groups.push(newGroup);
      setLocalGroups([...groups]);
      navigate(`/group/${newGroup.id}`);
    }
  };

  return (
    <GroupLayout
      title="친구 찾기"
      subtitle="그룹을 만들어 친구들끼리 근무표를 공유해보세요"
    >
      {/* 그룹 목록 화면 */}
      <div className="space-y-3">
        {localGroups.map((g) => (
          <div
            key={g.id}
            className="flex items-center bg-white rounded-xl p-3 shadow border cursor-pointer"
            onClick={() => navigate(`/group/${g.id}`)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base">{g.name}</span>
                <span className="flex items-center text-gray-500 text-sm ml-2">
                  <FaUserFriends className="mr-1" /> {g.count}
                </span>
              </div>
              <div className="text-gray-500 text-sm">{g.desc}</div>
            </div>
            <img
              src={g.img}
              alt={g.name}
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
