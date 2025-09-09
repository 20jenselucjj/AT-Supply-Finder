import React from 'react';
import { cn } from '@/lib/utils/utils';
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  padded?: boolean; // allow disabling padding if needed
}

// Provides a consistent horizontal rhythm & vertical spacing across pages,
// especially on mobile. Wrap your <main> contents in this for uniformity.
export const PageContainer = ({ children, className, as = 'div', padded = true }: PageContainerProps) => {
  const Component: any = as;
  return (
    <Component
      className={cn(
        'w-full mx-auto',
        padded && 'px-4 sm:px-6',
        'max-w-screen-xl',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default PageContainer;
