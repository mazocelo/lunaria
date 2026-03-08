import React from 'react';

const Skeleton = ({ className = '', variant = 'text', width, height, count = 1 }) => {
  const base = 'skeleton';

  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 w-48 rounded',
    avatar: 'w-12 h-12 rounded-full',
    card: 'h-32 rounded-lg',
    button: 'h-10 w-24 rounded-lg',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`${base} ${variants[variant]} ${className}`} style={style} />
        ))}
      </div>
    );
  }

  return <div className={`${base} ${variants[variant]} ${className}`} style={style} />;
};

export default Skeleton;
