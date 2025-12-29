import React from 'react';
import { cn } from '../../lib/utils';

export const PageContainer = ({ children, className, maxWidth = 'max-w-container' }) => {
  return (
    <div className={cn(maxWidth, 'mx-auto px-4 py-6', className)}>
      {children}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, action, className }) => {
  return (
    <div className={cn('mb-6 pb-4 border-b border-borderLight', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};
