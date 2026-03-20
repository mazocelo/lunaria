import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { useLocation } from 'react-router-dom';

/**
 * Gothic decorative elements — spider webs + animated bats.
 * Bats fly in front of content (high z-index), flap wings via CSS.
 */

const SpiderWeb = ({ side = 'left', position = 'top', size = 140 }) => {
  const isBottom = position === 'bottom';
  const isRight = side === 'right';
  const transforms = [];
  if (isRight) transforms.push('scaleX(-1)');
  if (isBottom) transforms.push('scaleY(-1)');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`fixed ${isBottom ? 'bottom-0' : 'top-0'} ${isRight ? 'right-0' : 'left-0'} pointer-events-none z-[2]`}
      style={{ opacity: 0.25, transform: transforms.join(' ') || undefined }}
    >
      {[0, 12, 24, 36, 48, 60, 72, 84, 90].map(angle => {
        const rad = (angle * Math.PI) / 180;
        return <line key={angle} x1="0" y1="0" x2={Math.cos(rad) * 118} y2={Math.sin(rad) * 118} stroke="#d4c4b0" strokeWidth="0.6" />;
      })}
      {[20, 38, 55, 72, 88, 105].map(r => (
        <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} fill="none" stroke="#d4c4b0" strokeWidth="0.5" />
      ))}
      <path d="M 60 0 Q 55 30 50 45 Q 48 55 52 60" fill="none" stroke="#d4c4b0" strokeWidth="0.4" />
      <path d="M 40 0 Q 38 20 42 35 Q 44 42 40 48" fill="none" stroke="#d4c4b0" strokeWidth="0.3" />
    </svg>
  );
};

// Bat SVG — more detailed with wing membrane lines
const BatSvg = ({ size = 50, color = '#cc3333' }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 60 33" className="gothic-bat-wings">
    {/* Body */}
    <ellipse cx="30" cy="18" rx="5" ry="4" fill={color} />
    {/* Head */}
    <circle cx="30" cy="12" r="3.5" fill={color} />
    {/* Eyes */}
    <circle cx="28.5" cy="11.5" r="0.8" fill="#ff4444" opacity="0.8" />
    <circle cx="31.5" cy="11.5" r="0.8" fill="#ff4444" opacity="0.8" />
    {/* Ears */}
    <path d="M27 9 L25.5 4 L28 8 Z" fill={color} />
    <path d="M33 9 L34.5 4 L32 8 Z" fill={color} />
    {/* Left wing */}
    <path d="M25 17 Q15 6 3 12 Q8 14 10 17 Q12 20 16 19 Q18 18 20 19 Q22 20 24 18 Z" fill={color} opacity="0.9" />
    {/* Left wing membrane lines */}
    <line x1="25" y1="17" x2="8" y2="13" stroke={color} strokeWidth="0.4" opacity="0.5" />
    <line x1="25" y1="17" x2="14" y2="14" stroke={color} strokeWidth="0.3" opacity="0.4" />
    {/* Right wing */}
    <path d="M35 17 Q45 6 57 12 Q52 14 50 17 Q48 20 44 19 Q42 18 40 19 Q38 20 36 18 Z" fill={color} opacity="0.9" />
    {/* Right wing membrane lines */}
    <line x1="35" y1="17" x2="52" y2="13" stroke={color} strokeWidth="0.4" opacity="0.5" />
    <line x1="35" y1="17" x2="46" y2="14" stroke={color} strokeWidth="0.3" opacity="0.4" />
    {/* Tail */}
    <path d="M28 22 Q30 26 32 22" fill="none" stroke={color} strokeWidth="0.6" />
  </svg>
);

const BatSwarm = ({ count = 6, trigger }) => {
  const [bats, setBats] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const newBats = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      y: 5 + Math.random() * 30,
      duration: 2.5 + Math.random() * 2,
      delay: i * 0.3,
      size: 40 + Math.random() * 30,
      flapSpeed: 0.15 + Math.random() * 0.1,
    }));
    setBats(newBats);
    const timer = setTimeout(() => setBats([]), 8000);
    return () => clearTimeout(timer);
  }, [trigger, count]);

  return (
    <>
      {bats.map(bat => (
        <div
          key={bat.id}
          className="fixed pointer-events-none z-[100]"
          style={{
            top: `${bat.y}%`,
            left: '-80px',
            animation: `batFlyFast ${bat.duration}s ease-in-out ${bat.delay}s forwards`,
            filter: 'drop-shadow(0 0 6px rgba(204, 51, 51, 0.4))',
          }}
        >
          <div style={{ animation: `batFlap ${bat.flapSpeed}s ease-in-out infinite alternate` }}>
            <BatSvg size={bat.size} />
          </div>
        </div>
      ))}
    </>
  );
};

const GothicDecorations = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const [batTrigger, setBatTrigger] = useState(0);

  useEffect(() => {
    if (theme === 'gothic') setBatTrigger(t => t + 1);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'gothic') return;
    setBatTrigger(t => t + 1);
  }, [location.pathname.split('/').filter(Boolean)[0]]);

  if (theme !== 'gothic') return null;

  return (
    <>
      {/* Webs */}
      <SpiderWeb side="left" position="top" size={160} />
      <SpiderWeb side="right" position="top" size={130} />
      <SpiderWeb side="left" position="bottom" size={100} />
      <SpiderWeb side="right" position="bottom" size={110} />

      {/* Ambient bats — fly in front of content (z-30), with wing flap */}
      {[
        { top: '10%', duration: 28, delay: 3, size: 55, opacity: 0.6 },
        { top: '20%', duration: 38, delay: 14, size: 45, opacity: 0.5 },
        { top: '32%', duration: 48, delay: 26, size: 38, opacity: 0.4 },
      ].map((bat, i) => (
        <div
          key={`amb-${i}`}
          className="fixed pointer-events-none z-[30]"
          style={{
            top: bat.top,
            animation: `batFly ${bat.duration}s linear ${bat.delay}s infinite`,
            opacity: bat.opacity,
            filter: 'drop-shadow(0 0 4px rgba(204, 51, 51, 0.3))',
          }}
        >
          <div style={{ animation: `batFlap 0.2s ease-in-out infinite alternate` }}>
            <BatSvg size={bat.size} />
          </div>
        </div>
      ))}

      {/* Bat swarm on navigation */}
      <BatSwarm count={6} trigger={batTrigger} />
    </>
  );
};

export default GothicDecorations;
