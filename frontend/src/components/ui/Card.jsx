import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ children, className, hover = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'linkedin-card p-6',
        hover && 'transition-shadow duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <h3 ref={ref} className={cn('text-lg font-semibold text-gray-900 leading-none', className)} {...props}>
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex items-center mt-4 pt-4 border-t border-borderLight', className)} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';
