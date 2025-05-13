import axiosInstance from '@/lib/axios';
import axios from 'axios';

// 타입 정의
export interface DayDuty {
  myShift: 'D' | 'E' | 'N' | 'O' | 'M';
  otherShifts: {
    grade: number;
    name: string;
    shift: 'D' | 'E' | 'N' | 'O' | 'M';
  }[];
}

export interface MyDuty {
  year: number;
  month: number;
  prevShifts: string; // 전달 일주일
  nextShifts: string; // 다음달 일주일
  shifts: string; // 이번달 근무표
}

export interface DutyHistory {
  idx: number;
  memberId: number;
  name: string;
  before: string;
  after: string;
  modifiedDay: number;
  isAutoCreated: boolean;
}

export interface DutyIssue {
  memberId: number;
  name: string;
  startDate: number;
  endDate: number;
  endDateShift: string;
  message: string;
}

export interface WardDuty {
  id: string;
  year: number;
  month: number;
  duty: {
    memberId: number;
    name: string;
    shifts: string;
    role: 'HN' | 'RN';
    shiftType: 'M' | 'N' | 'All';
    grade: number;
  }[];
}

export interface DutyInfo {
  id: string;
  year: number;
  month: number;
  invalidCnt: number;
  duty: {
    memberId: number;
    name: string;
    role: 'HN' | 'RN';
    prevShifts: string;
    shifts: string;
    shiftType: 'M' | 'N' | 'All';
    grade: number;
  }[];
  issues: DutyIssue[];
  histories: DutyHistory[];
}

export interface DutyUpdateRequest {
  year: number;
  month: number;
  history: {
    memberId: number;
    name: string;
    before: string;
    after: string;
    modifiedDay: number;
    isAutoCreated: boolean;
  };
}

// 개인 근무표 수정 요청 인터페이스
export interface EditMemberDutyRequestDto {
  year: number;
  month: number;
  day: number;
  shift: 'D' | 'E' | 'N' | 'O' | 'X' | 'M';
}

export interface UnreflectedRequest {
  requestId: number;
  memberId: number;
  memberName: string;
  requestDate: string;
  requestShift: string;
  actualShift: string;
  requestMemo: string;
}

export interface AutoCreateResponse {
  message: string;
  unreflectedRequestsCount: number;
  unreflectedRequests: UnreflectedRequest[];
  success: boolean;
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly';

// API 서비스
export const dutyService = {
  /**
   * 특정 날짜 근무 조회
   * @param year - 년도
   * @param month - 월
   * @param date - 일
   */
  getMyDayDuty: (year: number, month: number, date: number) => {
    return axiosInstance
      .get('/duty/my/date', {
        params: { year, month, date },
      })
      .then((response) => {
        return response.data as DayDuty;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            default:
              console.error('Error occurred:', error);
              throw error;
          }
        }
        throw error;
      });
  },

  /**
   * 나의 근무표 조회
   * @param year - 년도 (선택)
   * @param month - 월 (선택)
   */
  getMyDuty: (year?: number, month?: number) => {
    const params = year && month ? { year, month } : {};
    return axiosInstance
      .get('/duty/my', { params })
      .then((response) => {
        return response.data as MyDuty;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            case 400:
              throw new Error(error.response.data.message);
            default:
              throw new Error(error.response.data.message);
          }
        }
        throw error;
      });
  },

  /**
   * 병동 근무표 조회
   * @returns 병동의 전체 근무표 정보
   */
  getWardDuty: (year?: number, month?: number) => {
    const params = year && month ? { year, month } : {};
    return axiosInstance
      .get('/duty/ward', { params })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            case 400:
              throw new Error(error.response.data.message);
            default:
              window.location.href = '/error';
              break;
          }
        }
        throw error;
      });
  },

  /**
   * 근무표 자동 생성
   * @param year - 년도
   * @param month - 월
   * @param force - 강제 자동생성 여부
   * @param priorityRequestIds - 우선순위를 부여할 요청 ID 배열 (선택사항)
   * @returns AutoCreateResponse - 자동 생성 결과 (반영되지 않은 요청 목록 포함)
   */
  autoCreateDuty: (
    year: number,
    month: number,
    force?: boolean,
    priorityRequestIds?: number[]
  ) => {
    return axiosInstance
      .get('/duty/auto-create', {
        params: {
          year,
          month,
          force,
          priorityRequestIds: priorityRequestIds?.join(','),
        },
      })
      .then((response) => {
        return response.data as AutoCreateResponse;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            default:
              console.error('Error occurred:', error);
              throw error;
          }
        }
        throw error;
      });
  },

  /**
   * 근무표 수정
   * @param data - 수정할 근무 정보
   */
  updateDuty: (data: DutyUpdateRequest) => {
    return axiosInstance
      .put(`/duty`, data)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            default:
              console.error('Error occurred:', error);
              throw error;
          }
        }
        throw error;
      });
  },

  /**
   * 근무표 조회/되돌리기
   * @param params - 조회할 근무표 정보 (year, month, history)
   */
  getDuty: (params: { year?: number; month?: number; history?: number }) => {
    return axiosInstance
      .get('/duty', { params })
      .then((response) => {
        return response.data as DutyInfo;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            default:
              console.error('Error occurred:', error);
              throw error;
          }
        }
        throw error;
      });
  },

  /**
   * 근무표 초기화하기
   * @param year - 년도
   * @param month - 월
   */
  resetDuty: (year: number, month: number) => {
    return axiosInstance
      .post('/duty/reset', null, {
        params: { year, month },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          console.error(
            '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          );
          throw new Error('서버 연결 실패');
        }
        if (error.response) {
          switch (error.response.status) {
            case 401:
              window.location.href = '/login';
              break;
            default:
              console.error('Error occurred:', error);
              throw error;
          }
        }
        throw error;
      });
  },

  /**
   * 개인 근무표 수정 API
   * @param data - 개인 근무표 수정 데이터
   */
  updateMyDuty: async (data: EditMemberDutyRequestDto) => {
    try {
      const response = await axiosInstance.put('/duty/my', data);
      return response.data;
    } catch (error) {
      console.error('개인 근무표 수정 실패:', error);
      throw error;
    }
  },

  updateShiftBatch: async (requests: any[]) => {
    try {
      const response = await axiosInstance.put('/duty', requests);
      return response.data;
    } catch (error) {
      console.error('Failed to update shifts:', error);
      throw error;
    }
  },

  getAutoGenCount: async () => {
    try {
      const response = await axiosInstance.get('/payment');
      return response.data.autoGenCnt;
    } catch (error) {
      console.error('자동 생성 횟수 조회 실패:', error);
      throw error;
    }
  },

  // 구독 API 호출 함수 추가
  subscribe: async () => {
    try {
      const response = await axiosInstance.patch('/payment');
      return response.data;
    } catch (error) {
      console.error('구독 처리 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 반영되지 않은 요청 재반영 API
   * @param year - 년도
   * @param month - 월
   * @param requestIds - 재반영할 요청 ID 목록
   * @returns AutoCreateResponse - 자동 생성 결과 (반영되지 않은 요청 목록 포함)
   */
  reAutoCreateDuty: async (
    year: number,
    month: number,
    requestIds: number[]
  ) => {
    try {
      const response = await axiosInstance.post('/duty/re-auto-create', {
        year,
        month,
        requestIds,
      });
      return response.data as AutoCreateResponse;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        console.error(
          '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
        );
        throw new Error('서버 연결 실패');
      }
      if (error.response) {
        switch (error.response.status) {
          case 401:
            window.location.href = '/login';
            break;
          default:
            console.error('Error occurred:', error);
            throw error;
        }
      }
      throw error;
    }
  },

  updateDutyColors: async (colors: any) => {
    try {
      const response = await axiosInstance.put('/duty/color', colors);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data;
      }
      throw error;
    }
  },
};
