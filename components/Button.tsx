import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-forest text-paper hover:bg-leaf hover:text-forest shadow-lg',
    secondary: 'bg-sand text-forest border border-forest/10 hover:bg-forest hover:text-paper',
    outline: 'bg-transparent border-2 border-forest text-forest hover:bg-sand',
    danger: 'bg-earth text-white hover:opacity-90 shadow-md',
  };

  const sizes = {
    sm: 'px-6 py-2 text-sm min-h-[40px]',
    md: 'px-8 py-3 text-base min-h-[48px]',
    lg: 'px-10 py-4 text-lg min-h-[56px]',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;