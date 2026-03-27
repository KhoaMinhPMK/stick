import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', ...props }) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`} 
      {...props}
    >
      {name}
    </span>
  );
};