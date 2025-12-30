import React from 'react';

export const Input = React.forwardRef(({
  type = 'text',
  placeholder = '',
  className = '',
  error = false,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={`
        w-full px-4 py-2 rounded-lg border
        ${error ? 'border-red-500' : 'border-gray-300'}
        focus:outline-none focus:ring-2 focus:ring-stevensMaroon focus:border-transparent
        transition-all duration-200
        ${className}
      `}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const SearchInput = ({ placeholder = 'Search...', className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border border-transparent
                   focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-stevensMaroon
                   transition-all duration-200"
        {...props}
      />
    </div>
  );
};

export const Textarea = React.forwardRef(({
  placeholder = '',
  className = '',
  rows = 3,
  error = false,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      placeholder={placeholder}
      rows={rows}
      className={`
        w-full px-4 py-2 rounded-lg border
        ${error ? 'border-red-500' : 'border-gray-300'}
        focus:outline-none focus:ring-2 focus:ring-stevensMaroon focus:border-transparent
        transition-all duration-200 resize-none
        ${className}
      `}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
