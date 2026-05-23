import type { CSSProperties } from 'react';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'button';

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) => {
  const base = 'skeleton';

  const variants: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded',
    title: 'h-6 w-48 rounded',
    avatar: 'w-12 h-12 rounded-full',
    card: 'h-32 rounded-lg',
    button: 'h-10 w-24 rounded-lg',
  };

  const style: CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;

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
