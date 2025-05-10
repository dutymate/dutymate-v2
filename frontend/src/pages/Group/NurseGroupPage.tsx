import { useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import { PiPlusCircle } from 'react-icons/pi';

type Group = {
  id: number;
  name: string;
  desc: string;
  count: number;
  img: string;
};

const INITIAL_GROUPS: Group[] = [
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

const NurseGroupPage = () => {
  const navigate = useNavigate();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

  const handleAddGroup = (group: {
    name: string;
    desc: string;
    img: string;
  }) => {
    setGroups((prev) => [...prev, { ...group, id: Date.now(), count: 1 }]);
  };

  return (
    <GroupLayout
      title="친구 찾기"
      subtitle="그룹을 만들어 친구들끼리 근무표를 공유해보세요"
    >
      {/* 그룹 목록 화면 */}
      <div className="space-y-3">
        {groups.map((g) => (
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
