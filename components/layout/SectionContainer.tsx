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
  // All variants now use the same deep-green near-black so the page reads as
  // one continuous dark canvas (the hero keeps its own background).
  const bgStyles = {
    white: '[background-color:#0f1612] text-white',
    light: '[background-color:#0f1612] text-white',
    dark: '[background-color:#0f1612] text-white',
    gradient: '[background-color:#0f1612] text-white',
  };

  const paddingStyles = {
    sm: 'py-12 px-4 sm:px-6 lg:px-8',
    md: 'py-16 px-4 sm:px-6 lg:px-8',
    lg: 'py-24 px-4 sm:px-6 lg:px-8',
    xl: 'py-32 px-4 sm:px-6 lg:px-8',
  };

  return (
    <section
      className={clsx(
        bgStyles[background],
        paddingStyles[padding],
        fullHeight && 'min-h-screen',
        'relative overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  );
}
