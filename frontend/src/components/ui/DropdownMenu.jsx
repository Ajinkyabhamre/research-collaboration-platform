import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = React.forwardRef(
  ({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        'flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm',
        'outline-none focus:bg-muted',
        'data-[state=open]:bg-muted',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
);
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white p-1 shadow-elevated',
      'data-[state=open]:animate-scale-in',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white p-1 shadow-elevated',
          'data-[state=open]:animate-scale-in',
          'data-[state=closed]:animate-fade-out',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm',
        'outline-none transition-colors',
        'focus:bg-muted focus:text-gray-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuCheckboxItem = React.forwardRef(
  ({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm',
        'outline-none transition-colors',
        'focus:bg-muted focus:text-gray-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const DropdownMenuRadioItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm',
        'outline-none transition-colors',
        'focus:bg-muted focus:text-gray-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const DropdownMenuLabel = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-3 py-2 text-xs font-semibold text-muted-foreground',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-borderLight', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
