interface DutyBadgeProps {
  type: 'day' | 'evening' | 'night' | 'off' | 'mid';
  size?: 'xxs' | 'xs' | 'sm' | 'md';
  bgColor?: string;
  textColor?: string;
}

export const DutyBadgeKor = ({
  type,
  size = 'md',
  bgColor,
  textColor,
}: DutyBadgeProps) => {
  const defaultBadgeStyles = {
    day: 'bg-duty-day-bg text-duty-day',
    evening: 'bg-duty-evening-bg text-duty-evening',
    night: 'bg-duty-night-bg text-duty-night text-[100%]',
    off: 'bg-base-white text-duty-off border border-duty-off',
    mid: 'bg-duty-mid-bg text-duty-mid',
  };

  const borderWidthStyles = {
    xxs: 'border-[0.1rem]',
    xs: 'border-[0.15rem]', // 2.4px
    sm: 'border-[0.2rem]', // 3.2px
    md: 'border-[0.25rem]', // 4px
  };

  const sizeStyles = {
    xxs: 'text-sm w-[48px] h-[28px]',
    xs: 'text-xl w-[66px] h-[36px]',
    sm: 'text-2xl w-[88px] h-[48px]',
    md: 'text-3xl w-[110px] h-[60px]',
  };

  const roundedStyles = {
    xxs: 'rounded-[9px]',
    xs: 'rounded-[9px]',
    sm: 'rounded-[13px]',
    md: 'rounded-[18px]',
  };

  const badgeLabels = {
    day: '데이',
    evening: '이브닝',
    night: '나이트',
    off: '오프',
    mid: '미드',
  };

  // If custom colors are provided, use inline styles instead of Tailwind classes
  const customStyle =
    bgColor || textColor
      ? {
          backgroundColor: bgColor,
          color: textColor,
        }
      : undefined;

  return (
    <span
      translate="no"
      className={`
        inline-flex items-center justify-center
        ${roundedStyles[size]}
        font-semibold
        whitespace-nowrap
        ${!(bgColor || textColor) ? defaultBadgeStyles[type] : ''}
        ${type === 'off' && !bgColor ? borderWidthStyles[size] : ''}
        ${sizeStyles[size]}
      `}
      style={customStyle}
    >
      {badgeLabels[type]}
    </span>
  );
};
