export const validateName = (
  name: string
): { isValid: boolean; message: string } => {
  // 특수문자 검사를 위한 정규식
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+/;

  // 금지된 이름 목록
  const forbiddenNames = [
    // 서비스 관련
    'dutymate',
    'duty',
    'mate',
    '듀티메이트',
    '듀티',
    '메이트',

    // 관리자/시스템 관련
    'admin',
    'administrator',
    'system',
    'owner',
    'master',
    'root',
    'manager',
    'staff',
    'support',
    'help',
    '관리자',
    '어드민',
    '시스템',
    '운영자',
    '매니저',

    // 직위 관련
    '수간호사',
    '간호부장',
    '간호과장',
    '간호사',
    '간호팀장',
    '병원장',

    // 서비스 신뢰성 관련
    'official',
    'test',
    'tester',
    'guest',
    '공식',
    '테스트',
    '게스트',
  ];

  // 대소문자 구분 없이 비교하기 위해 소문자로 변환
  const lowerName = name.toLowerCase();
  if (
    forbiddenNames.some((forbidden) => forbidden.toLowerCase() === lowerName)
  ) {
    return {
      isValid: false,
      message: '사용할 수 없는 이름입니다.',
    };
  }

  if (specialCharRegex.test(name)) {
    return {
      isValid: false,
      message: '특수문자는 사용할 수 없습니다.',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};

export const validateNickname = (
  nickname: string
): { isValid: boolean; message: string } => {
  // 닉네임은 () 를 제외한 특수문자 검사를 위한 정규식
  const specialCharRegex = /[!@#$%^&*_+\-=\[\]{};':"\\|,.<>/?]+/;

  // 금지된 닉네임 목록 (이름과 동일한 목록 사용)
  const forbiddenNicknames = [
    // 서비스 관련
    'dutymate',
    'duty',
    'mate',
    '듀티메이트',
    '듀티',
    '메이트',

    // 관리자/시스템 관련
    'admin',
    'administrator',
    'system',
    'owner',
    'master',
    'root',
    'manager',
    'staff',
    'support',
    'help',
    '관리자',
    '어드민',
    '시스템',
    '운영자',
    '매니저',

    // 직위 관련
    '수간호사',
    '간호부장',
    '간호과장',
    '간호사',
    '간호팀장',
    '병원장',

    // 서비스 신뢰성 관련
    'official',
    'test',
    'tester',
    'guest',
    '공식',
    '테스트',
    '게스트',
  ];

  // 대소문자 구분 없이 비교하기 위해 소문자로 변환
  const lowerNickname = nickname.toLowerCase();
  if (
    forbiddenNicknames.some(
      (forbidden) => forbidden.toLowerCase() === lowerNickname
    )
  ) {
    return {
      isValid: false,
      message: '사용할 수 없는 닉네임입니다.',
    };
  }

  if (specialCharRegex.test(nickname)) {
    return {
      isValid: false,
      message: '() 외의 특수문자는 사용할 수 없습니다.',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};
