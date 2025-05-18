// 로그인 응답 타입
export interface LoginResponse {
  token: string;
  memberId: number;
  name: string;
  role: string;
  profileImg: string | null;
  provider: string;
  existAdditionalInfo: boolean;
  existMyWard: boolean;
  sentWardCode: boolean;
  isDemo?: boolean;
  color?: ColorTheme;
}

// 사용자 기본 정보 타입
export interface UserInfo {
  token: string;
  memberId: number;
  name: string;
  role: string | null;
  provider: string;
  profileImg: string | null;
  existAdditionalInfo: boolean;
  existMyWard: boolean;
  sentWardCode: boolean;
  isDemo?: boolean; //데모 계정 여부 추가
  color?: ColorTheme;
}

// 색상 테마 타입
export interface ColorTheme {
  dayBg: string;
  dayText: string;
  eveningBg: string;
  eveningText: string;
  nightBg: string;
  nightText: string;
  offBg: string;
  offText: string;
  midBg: string;
  midText: string;
}

// 부가 정보 타입
export interface AdditionalInfo {
  grade: number;
  gender: 'F' | 'M';
  role: 'RN' | 'HN'; // RN: 평간호사, HN: 수간호사
}

// 스토어 상태 타입
export interface UserAuthState {
  // 상태
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  additionalInfo: AdditionalInfo | null;
  isTimeout: boolean;
  timeLeft: number;

  // 액션
  setUserInfo: (userInfo: UserInfo) => void;
  setAdditionalInfo: (additionalInfo: AdditionalInfo) => void;
  logout: () => void;
  setProfileImg: (profileImgUrl: string | null) => void;
  setTimeout: (isTimeout: boolean) => void;
  setTimeLeft: (timeLeft: number) => void;
}