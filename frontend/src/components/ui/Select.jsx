import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none px-4 py-2 pr-10 rounded-lg border bg-white',
            'focus:outline-none focus:ring-2 focus:ring-stevensMaroon focus:border-transparent',
            'transition-all duration-200',
            'text-gray-900',
            error ? 'border-destructive' : 'border-gray-300',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
