import React from 'react';
import clsx from 'clsx';

interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  background?: 'white' | 'light' | 'dark' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  fullHeight?: boolean;
}

export function SectionContainer({
  background = 'white',
  padding = 'lg',
  fullHeight = false,
  className,
  children,
  ...props
}: SectionContainerProps) {
  const bgStyles = {
    white: 'bg-white text-slate-900',
    light: 'bg-slate-50 text-slate-900',
    dark: 'bg-slate-900 text-white',
    gradient: 'bg-slate-900 text-white',
  };

  const paddingStyles = {
    sm: 'py-12 px-4 sm:px-6 lg:px-8',
    md: 'py-16 px-4 sm:px-6 lg:px-8',
    lg: 'py-24 px-4 sm:px-6 lg:px-8',
    xl: 'py-32 px-4 sm:px-6 lg:px-8',
  };

  const keepBg = background === 'white' || background === 'light';

  return (
    <section
      className={clsx(
        bgStyles[background],
        paddingStyles[padding],
        fullHeight && 'min-h-screen',
        'relative overflow-hidden',
        className
      )}
      {...(keepBg && { 'data-keep-bg': true })}
      {...props}
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  );
}
