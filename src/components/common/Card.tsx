import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Card = ({ children, className, title }: CardProps) => {
  return (
    <div className={clsx('card-core', className)}>
      {title && (
        <h3 className="text-xl font-sans font-semibold text-white mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};
