import { ColorTheme } from '@/stores/userAuthStore';

export type DutyCode = 'D' | 'E' | 'N' | 'O' | 'X' | 'M';
export type DutyType = 'day' | 'evening' | 'night' | 'off' | 'mid';

/**
 * 근무 코드를 근무 타입으로 변환합니다.
 * @param duty 근무 코드
 * @returns 근무 타입 또는 null (X 코드의 경우)
 */
export const convertDutyType = (duty: DutyCode): DutyType | null => {
  const dutyMap = {
    D: 'day',
    E: 'evening',
    N: 'night',
    O: 'off',
    X: null,
    M: 'mid',
  } as const;
  return dutyMap[duty];
};

/**
 * 근무 코드를 안전하게 근무 타입으로 변환합니다.
 * null 값이 반환될 경우 기본값을 사용합니다.
 * @param duty 근무 코드
 * @param defaultType null일 경우 사용할 기본 타입 (기본값: 'off')
 * @returns 근무 타입
 */
export const convertDutyTypeSafe = (
  duty: DutyCode,
  defaultType: DutyType = 'off'
): DutyType => {
  const dutyType = convertDutyType(duty);
  return dutyType !== null ? dutyType : defaultType;
};

// 기본 색상 정의
export const DEFAULT_DUTY_COLORS: Record<
  DutyType,
  { bg: string; text: string }
> = {
  day: { bg: '#D0E5D2', text: '#61A86A' },
  off: { bg: '#E5E5E1', text: '#999786' },
  evening: { bg: '#FCDADA', text: '#F68585' },
  night: { bg: '#D5CCF5', text: '#7454DF' },
  mid: { bg: '#D2E5FD', text: '#68A6FC' },
};

/**
 * 사용자 색상 설정 또는 기본 색상을 기반으로 duty 색상 객체를 생성합니다.
 * @param userColor 사용자 색상 설정 (없으면 기본 색상 사용)
 * @returns Duty 타입별 색상 객체
 */
export const getDutyColors = (userColor?: ColorTheme | null) => {
  if (!userColor) return DEFAULT_DUTY_COLORS;

  return {
    day: {
      bg: userColor.dayBg ? `#${userColor.dayBg}` : DEFAULT_DUTY_COLORS.day.bg,
      text: userColor.dayText
        ? `#${userColor.dayText}`
        : DEFAULT_DUTY_COLORS.day.text,
    },
    off: {
      bg: userColor.offBg ? `#${userColor.offBg}` : DEFAULT_DUTY_COLORS.off.bg,
      text: userColor.offText
        ? `#${userColor.offText}`
        : DEFAULT_DUTY_COLORS.off.text,
    },
    evening: {
      bg: userColor.eveningBg
        ? `#${userColor.eveningBg}`
        : DEFAULT_DUTY_COLORS.evening.bg,
      text: userColor.eveningText
        ? `#${userColor.eveningText}`
        : DEFAULT_DUTY_COLORS.evening.text,
    },
    night: {
      bg: userColor.nightBg
        ? `#${userColor.nightBg}`
        : DEFAULT_DUTY_COLORS.night.bg,
      text: userColor.nightText
        ? `#${userColor.nightText}`
        : DEFAULT_DUTY_COLORS.night.text,
    },
    mid: {
      bg: userColor.midBg ? `#${userColor.midBg}` : DEFAULT_DUTY_COLORS.mid.bg,
      text: userColor.midText
        ? `#${userColor.midText}`
        : DEFAULT_DUTY_COLORS.mid.text,
    },
  };
};

/**
 * 근무 코드에 해당하는 색상을 안전하게 가져옵니다.
 * @param duty 근무 코드
 * @param colors 색상 객체
 * @param fallbackColor null일 경우 사용할 기본 색상 (기본값: off 색상)
 * @returns 색상 객체
 */
export const getDutyColorForCode = (
  duty: DutyCode,
  colors: Record<DutyType, { bg: string; text: string }>,
  fallbackType: DutyType = 'off'
): { bg: string; text: string } => {
  const dutyType = convertDutyType(duty);
  return dutyType !== null ? colors[dutyType] : colors[fallbackType];
};
