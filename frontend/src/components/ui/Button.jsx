import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stevensMaroon focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-stevensMaroon hover:bg-stevensMaroon-700 text-white shadow-sm hover:shadow',
        secondary: 'bg-stevensGray-200 hover:bg-stevensGray-300 text-stevensGray-900',
        outline: 'border-2 border-stevensMaroon text-stevensMaroon hover:bg-stevensMaroon-50',
        ghost: 'hover:bg-stevensGray-100 text-stevensGray-700',
        danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm',
        link: 'text-stevensMaroon hover:underline',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(({
  children,
  variant,
  size,
  className,
  disabled,
  loading,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      type={type}
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export const IconButton = React.forwardRef(({
  children,
  className,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      type={type}
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-full',
        'transition-colors duration-200',
        'hover:bg-stevensGray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stevensMaroon focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

IconButton.displayName = 'IconButton';
