import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import { SEO } from '@/components/SEO';
import { GroupListResponse, groupService } from '@/services/groupService';
import { useLoadingStore } from '@/stores/loadingStore';
import { Group } from '@/types/group';
import { useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { PiPlusCircle } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const NurseGroupPage = () => {
  const navigate = useNavigate();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // 그룹 목록 불러오기
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupService.getAllGroups();
      const formattedGroups = response.map((group: GroupListResponse) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        groupDescription: group.groupDescription,
        groupMemberCount: group.groupMemberCount,
        groupImg: group.groupImg,
      }));
      setGroups(formattedGroups);
    } catch (error: any) {
      console.error('Failed to fetch groups:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('그룹 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (group: {
    groupName: string;
    groupDescription: string;
    groupImg: string | null;
  }) => {
    try {
      // 그룹 생성 API 호출
      await groupService.createGroup({
        groupName: group.groupName,
        groupDescription: group.groupDescription,
        groupImg: group.groupImg,
      });

      // 그룹 목록 다시 불러오기
      await fetchGroups();

      toast.success('그룹이 생성되었습니다.');
    } catch (error: any) {
      console.error('Failed to create group:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('그룹 생성에 실패했습니다.');
      }
    }
  };

  useEffect(() => {
    useLoadingStore.setState({ isLoading: loading });
  }, [loading]);

  return (
    <>
      <SEO
        title="그룹 | Dutymate"
        description="동료 간호사들과 듀티표를 공유하는 공간입니다."
      />
      <GroupLayout
        title="나의 모임"
        subtitle="그룹을 만들어 친구들끼리 듀티표를 공유해보세요"
      >
        {/* 그룹 목록 화면 */}
        <div className="space-y-3 px-4 lg:px-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <PageLoadingSpinner />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              아직 참여한 그룹이 없습니다. 그룹을 만들어보세요!
            </div>
          ) : (
            groups.map((g) => (
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
                  <div className="text-gray-500 text-sm">
                    {g.groupDescription}
                  </div>
                </div>
                {g.groupImg && (
                  <img
                    src={g.groupImg}
                    alt={g.groupName}
                    className="w-16 h-16 rounded-lg object-cover ml-3"
                  />
                )}
              </div>
            ))
          )}
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
    </>
  );
};

export default NurseGroupPage;
