import React from 'react';

export function Card({
  className = '',
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`border border-border-line bg-bg-surface ${
        isClickable
          ? 'cursor-pointer transition-colors hover:border-border-line-strong hover:bg-bg-sunken'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
