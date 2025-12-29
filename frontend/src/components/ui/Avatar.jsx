import React from 'react';

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-32 h-32 text-4xl',
};

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  ...props
}) => {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Check if src is valid (not empty, null, or just whitespace)
  const hasValidImage = src && src.trim().length > 0;

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        flex items-center justify-center
        font-semibold
        overflow-hidden
        ${className}
      `}
      style={!hasValidImage ? { backgroundColor: '#9D1535', color: 'white' } : {}}
      {...props}
    >
      {hasValidImage ? (
        <img src={src} alt={alt || name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
