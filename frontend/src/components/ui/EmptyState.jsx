import React from 'react';
import { cn } from '../../lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-muted">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
