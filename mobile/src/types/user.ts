export interface LoginResponse {
    token: string;
    memberId: number;
    name: string;
    role: string;
    profileImg: string;
    existAdditionalInfo: boolean;
    existMyWard: boolean;
    sentWardCode: boolean;
    provider: string;
  }