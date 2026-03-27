import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'sketch' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "transition-all font-headline font-bold";
  
  const variants = {
    primary: "px-10 py-4 bg-black text-white rounded-full text-xl hover:translate-x-1",
    sketch: "px-6 py-2 sketch-border bg-black text-white scale-95 active:scale-90",
    outline: "px-10 py-4 border-4 border-black rounded-full text-xl hover:bg-surface-container-highest transition-colors",
    ghost: "px-6 py-2 text-stone-600 hover:skew-x-1 hover:text-black tracking-tight"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};