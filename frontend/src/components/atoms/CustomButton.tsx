import React from 'react';

interface CustomButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  className = '',
  style,
}) => {
  return (
    <button className={className} onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export default CustomButton;
