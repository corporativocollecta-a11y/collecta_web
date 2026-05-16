import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-lg transition-all duration-300';

  const variantStyles = {
    default: 'bg-white border border-border-light',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/20',
  };

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    />
  );
}
