import React from 'react';

interface SketchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const SketchCard: React.FC<SketchCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = true,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white ${hoverEffect ? 'sketch-card' : 'sketch-border'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};