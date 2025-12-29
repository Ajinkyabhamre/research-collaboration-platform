import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cva } from 'class-variance-authority';

const alertVariants = cva(
  'rounded-lg p-4 flex items-start gap-3',
  {
    variants: {
      variant: {
        error: 'bg-red-50 border border-red-200 text-red-900',
        warning: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
        info: 'bg-blue-50 border border-blue-200 text-blue-900',
        success: 'bg-green-50 border border-green-200 text-green-900',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const iconColorMap = {
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  success: 'text-green-600',
};

export const InlineAlert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className
}) => {
  const Icon = iconMap[variant];

  return (
    <div className={cn(alertVariants({ variant }), className)}>
      {Icon && <Icon className={cn('w-5 h-5 flex-shrink-0', iconColorMap[variant])} />}
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-semibold text-sm mb-1">{title}</h5>
        )}
        {children && (
          <div className="text-sm">{children}</div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
