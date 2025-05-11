import axiosInstance from '@/lib/axios';
import axios from 'axios';
import { Group } from '@/types/group';

export interface GroupListResponse {
  groupId: number;
  groupName: string;
  groupDescription: string;
  groupMemberCount: number;
  groupImg: string;
}

export interface GroupCreateRequest {
  groupName: string;
  groupDescription?: string;
  groupImg?: string;
}

export interface GroupUpdateRequest {
  groupName?: string;
  groupDescription?: string;
  groupImg?: string;
}

export interface ApiErrorResponse {
  message: string;
  timestamp: string;
  status: string;
}

// 그룹 목록 조회
export const getAllGroups = async (): Promise<GroupListResponse[]> => {
  try {
    const response = await axiosInstance.get(`/group`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 상세 조회
export const getGroup = async (
  groupId: number,
  year?: number,
  month?: number,
  orderBy: 'name' | 'duty' = 'name'
): Promise<Group> => {
  try {
    let url = `/group/${groupId}`;
    const params = new URLSearchParams();

    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    params.append('orderBy', orderBy);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 생성
export const createGroup = async (data: GroupCreateRequest) => {
  try {
    const response = await axiosInstance.post(`/group`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 이미지 업로드
export const uploadGroupImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(`/group/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 정보 수정
export const updateGroup = async (
  groupId: number,
  data: GroupUpdateRequest
) => {
  try {
    const response = await axiosInstance.put(`/group/${groupId}`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 탈퇴/삭제
export const leaveGroup = async (groupId: number) => {
  try {
    const response = await axiosInstance.delete(`/group/${groupId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 초대 링크 생성
export const createInvitationLink = async (groupId: number) => {
  try {
    const response = await axiosInstance.post(`/group/${groupId}/invite-link`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 초대 링크로 그룹 참가
export const joinGroupByInvite = async (inviteToken: string) => {
  try {
    const response = await axiosInstance.post(
      `/group/invite/${inviteToken}/join`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 멤버 전체 조회
export const getAllGroupMembers = async (groupId: number) => {
  try {
    const response = await axiosInstance.get(`/group/${groupId}/member`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 멤버 내보내기
export const exportGroupMembers = async (groupId: number, memberId: number) => {
  try {
    const response = await axiosInstance.get(
      `/group/${groupId}/member/${memberId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

// 그룹 멤버 추방 API
export const removeGroupMember = async (
  groupId: number | string,
  memberId: number
) => {
  try {
    const response = await axiosInstance.delete(
      `/group/${groupId}/member/${memberId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data;
    }
    throw error;
  }
};

export const groupService = {
  getAllGroups,
  getGroup,
  createGroup,
  uploadGroupImage,
  updateGroup,
  leaveGroup,
  createInvitationLink,
  joinGroupByInvite,
  getAllGroupMembers,
  removeGroupMember,
};
