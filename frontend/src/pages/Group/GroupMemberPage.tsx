import { FaCrown, FaUserFriends, FaUserPlus } from 'react-icons/fa';
import { HiOutlinePencil } from 'react-icons/hi2';
import { useNavigate, useParams } from 'react-router-dom';
import GroupLayout from '@/components/organisms/Group/GroupLayout';
import CheckMemberModal from '@/components/organisms/Group/CheckMemberModal';
import EditGroupModal from '@/components/organisms/Group/EditGroupModal';
import InviteMemberModal from '@/components/organisms/Group/InviteMemberModal';
import ExitGroupModal from '@/components/organisms/Group/ExitGroupModal';
import RemoveMemberModal from '@/components/organisms/Group/RemoveMemberModal';
import { useState, useEffect } from 'react';
import { groupService } from '@/services/groupService';
import { toast } from 'react-toastify';
import { Group, GroupMember } from '@/types/group';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import { useLoadingStore } from '@/stores/loadingStore';
import { SEO } from '@/components/SEO';

const GroupMemberPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkMemberOpen, setCheckMemberOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removeTargetMember, setRemoveTargetMember] = useState<
    number | undefined
  >(undefined);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');

  // 그룹 정보 가져오기
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);

        // 그룹 정보와 멤버 정보를 한 번에 가져오기
        const response = await groupService.getAllGroupMembers(Number(groupId));

        // 그룹 정보 설정
        const groupData = {
          groupId: response.groupId,
          groupName: response.groupName,
          groupDescription: response.groupDescription,
          groupMemberCount: response.groupMemberCount,
          groupImg: response.groupImg || '',
        };

        setGroupInfo(groupData);

        // 멤버 정보 설정
        if (response.memberList) {
          const memberList = response.memberList.map((member: GroupMember) => ({
            memberId: member.memberId,
            name: member.name,
            isLeader: member.isLeader,
            createdAt:
              member.createdAt || new Date().toISOString().slice(0, 10),
          }));

          setMembers(memberList);
          setSelectedMembers(memberList.map((m: GroupMember) => m.name));
        }
      } catch (error: any) {
        console.error('Failed to fetch group data:', error);
        if (error && error.message) {
          toast.error(error.message);
        } else {
          toast.error('그룹 정보를 불러오는데 실패했습니다.');
        }
        navigate('/group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, navigate]);

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

  if (!groupInfo) return <div>그룹을 찾을 수 없습니다.</div>;

  const handleKick = async (memberId: number) => {
    setRemoveTargetMember(memberId);
    setRemoveModalOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!removeTargetMember || !groupInfo) return;

    try {
      // API 호출 - 멤버 삭제
      await groupService.removeGroupMember(Number(groupId), removeTargetMember);

      // 1. 멤버 삭제
      const updatedMembers = members.filter(
        (m) => m.memberId !== removeTargetMember
      );
      // 2. 인원수 감소
      const updatedGroupInfo = {
        ...groupInfo,
        groupMemberCount: updatedMembers.length,
      };
      setGroupInfo(updatedGroupInfo);

      // 3. members 배열 동기화
      setMembers(updatedMembers);
      setSelectedMembers(updatedMembers.map((m: GroupMember) => m.name));
      setRemoveModalOpen(false);
      setRemoveTargetMember(undefined);

      toast.success(
        `${
          members.find((m) => m.memberId === removeTargetMember)?.name
        } 멤버를 그룹에서 내보냈습니다.`
      );
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('멤버 삭제에 실패했습니다.');
      }
    }
  };

  const handleEditGroup = async (data: {
    groupName: string;
    groupDescription: string;
    groupImg: string | null;
  }) => {
    console.log(data);
    if (!groupInfo) return;

    try {
      // API 호출
      await groupService.updateGroup(groupInfo.groupId, {
        groupName: data.groupName,
        groupDescription: data.groupDescription,
        groupImg: data.groupImg,
      });

      // 로컬 상태 업데이트
      setGroupInfo({ ...groupInfo, ...data });
      setEditModalOpen(false);
      toast.success('그룹 정보가 업데이트되었습니다.');
    } catch (error: any) {
      console.error('Failed to update group:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('그룹 정보 업데이트에 실패했습니다.');
      }
    }
  };

  const handleLeave = async () => {
    if (!groupInfo) return;

    try {
      await groupService.leaveGroup(groupInfo.groupId);
      navigate('/group');
      toast.success('그룹을 나갔습니다.');
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('그룹 나가기에 실패했습니다.');
      }
    }
  };

  const handleInviteButton = async () => {
    const response = await groupService.createInvitationLink(Number(groupId));
    setInviteLink(response.inviteUrl);
    setInviteModalOpen(true);
  };

  return (
    <>
      <SEO
        title="그룹 | Dutymate"
        description="동료 간호사들과 근무표를 공유하는 공간입니다."
      />
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
                src={groupInfo.groupImg || ''}
                alt={groupInfo.groupName || '그룹'}
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
                  <span className="flex items-center text-gray-500 text-sm ml-2">
                    <FaUserFriends className="mr-1" />{' '}
                    {groupInfo.groupMemberCount}
                  </span>
                </div>
                <div className="flex items-center w-full mt-1">
                  <div className="text-xs md:text-base text-gray-400 truncate flex-1">
                    {groupInfo.groupDescription}
                  </div>
                  <button
                    className="flex items-center border border-primary text-primary rounded-lg px-2 py-1 text-xs md:text-base md:px-4 md:py-2 font-semibold bg-white hover:bg-primary-50 ml-2"
                    type="button"
                    onClick={handleInviteButton}
                  >
                    <FaUserPlus className="mr-1 md:text-base" /> 친구 초대
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow border">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 font-semibold">
                  <th className="w-1/3 pb-3">이름</th>
                  <th className="w-1/3 pb-3">가입 날짜</th>
                  <th className="w-1/3 pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.memberId} className="text-center">
                    <td className="py-2">
                      <div className="flex justify-center">
                        {m.isLeader ? (
                          <span className="flex items-center bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-lg text-sm">
                            <FaCrown className="mr-1 text-yellow-400" />{' '}
                            {m.name}
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                            {m.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm py-2">
                      {m.createdAt}
                    </td>
                    <td className="py-2">
                      {!m.isLeader && (
                        <button
                          className="text-gray-500 text-sm hover:text-red-500"
                          onClick={() => handleKick(m.memberId)}
                        >
                          내보내기
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          groupId={Number(groupId)}
        />
        <EditGroupModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onAddGroup={handleEditGroup}
          initialData={{
            groupName: groupInfo.groupName || '',
            groupDescription: groupInfo.groupDescription || '',
            groupImg: groupInfo.groupImg || null,
            groupId: groupInfo.groupId,
          }}
        />
        <InviteMemberModal
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          inviteLink={inviteLink}
          groupName={groupInfo.groupName}
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
          memberName={
            members.find((m) => m.memberId === removeTargetMember)?.name
          }
          onRemove={handleRemoveMember}
        />
      </GroupLayout>
    </>
  );
};

export default GroupMemberPage;
