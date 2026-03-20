import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

/**
 * Gothic decorative elements — only rendered when theme is 'gothic'.
 * - Spider webs: static SVGs in top corners
 * - Bats: 1-2 silhouettes crossing screen every 30-60s via CSS animation
 */

const SpiderWeb = ({ side = 'left', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0 scale-x-[-1]'} pointer-events-none z-[2]`}
    style={{ opacity: 0.07 }}
  >
    {/* Radial threads from corner */}
    {[0, 15, 30, 45, 60, 75, 90].map(angle => {
      const rad = (angle * Math.PI) / 180;
      return (
        <line
          key={angle}
          x1="0" y1="0"
          x2={Math.cos(rad) * 115}
          y2={Math.sin(rad) * 115}
          stroke="#f5e6d3"
          strokeWidth="0.5"
        />
      );
    })}
    {/* Concentric arcs */}
    {[30, 55, 80, 105].map(r => (
      <path
        key={r}
        d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`}
        fill="none"
        stroke="#f5e6d3"
        strokeWidth="0.4"
      />
    ))}
  </svg>
);

const BatSilhouette = ({ delay = 0, duration = 35, y = 15 }) => (
  <div
    className="fixed pointer-events-none z-[2]"
    style={{
      top: `${y}%`,
      animation: `batFly ${duration}s linear ${delay}s infinite`,
      opacity: 0.1,
    }}
  >
    <svg width="40" height="20" viewBox="0 0 40 20" fill="#1a0a10">
      {/* Bat body */}
      <ellipse cx="20" cy="12" rx="4" ry="3" />
      {/* Left wing */}
      <path d="M16 12 Q8 4 2 8 Q6 10 8 12 Q10 14 14 13 Z" />
      {/* Right wing */}
      <path d="M24 12 Q32 4 38 8 Q34 10 32 12 Q30 14 26 13 Z" />
      {/* Ears */}
      <path d="M18 9 L17 6 L19 8 Z" />
      <path d="M22 9 L23 6 L21 8 Z" />
    </svg>
  </div>
);

const GothicDecorations = () => {
  const { theme } = useTheme();
  if (theme !== 'gothic') return null;

  return (
    <>
      <SpiderWeb side="left" size={100} />
      <SpiderWeb side="right" size={80} />
      <BatSilhouette delay={5} duration={40} y={12} />
      <BatSilhouette delay={25} duration={55} y={25} />
    </>
  );
};

export default GothicDecorations;
