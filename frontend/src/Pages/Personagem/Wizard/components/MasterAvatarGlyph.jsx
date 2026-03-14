import React from 'react';

const MasterAvatarGlyph = ({ size = 'md', isLight = false, glow = false, className = '' }) => {
  const sizeClass = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-[12px]',
    lg: 'h-12 w-12 text-[13px]',
  }[size] || 'h-10 w-10 text-[12px]';

  return (
    <div
      className={[
        'wa-master-glyph inline-flex items-center justify-center rounded-full',
        sizeClass,
        glow ? 'wa-glyph-glow' : '',
        isLight ? 'text-[var(--wa-violet)]' : 'text-[var(--wa-brass)]',
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-[70%] w-[70%]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 10L40 18L32 24L24 18L32 10Z" fill="currentColor" opacity="0.92" />
        <path d="M18 30C22 22 42 22 46 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        <path d="M24 31V39C24 44 27.5 48 32 48C36.5 48 40 44 40 39V31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 24V48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5" opacity="0.28" />
        <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.42" />
      </svg>
    </div>
  );
};

export default MasterAvatarGlyph;
