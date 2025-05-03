import { ReactNode } from 'react';

import { Icon, IconName } from '@/components/atoms/Icon';

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
  icon?: {
    name: string;
    size?: number;
    className?: string;
  };
  width?: string;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  icon = {
    name: 'alert',
    size: 16,
    className: 'text-gray-400 hover:text-gray-600 cursor-help',
  },
  width = 'w-80',
  className = '',
}: TooltipProps) => {
  return (
    <div className={`relative group ${className}`}>
      {children ? (
        <div className="inline-block"> {children} </div>
      ) : (
        <Icon
          name={icon.name as IconName}
          size={icon.size}
          className={icon.className}
        />
      )}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 ${width} bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] text-center`}
      >
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-800" />
        {content}
      </div>
    </div>
  );
};
