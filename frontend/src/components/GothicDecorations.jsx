import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { useLocation } from 'react-router-dom';

/**
 * Gothic decorative elements — spider webs + animated bats.
 * Bats fly in front of content (high z-index), flap wings via CSS.
 */

const BloodDrip = ({ left, delay = 0, duration = 8, height = 60 }) => (
  <div
    className="fixed pointer-events-none z-[3]"
    style={{ left: `${left}%`, top: '56px' }}
  >
    {/* Thin drip trail */}
    <div
      style={{
        width: '1px',
        height: `${height}px`,
        background: `linear-gradient(to bottom, rgba(139,0,0,0.6), rgba(180,20,20,0.3) 60%, transparent)`,
        opacity: 0,
        animation: `bloodDrip ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
    {/* Tiny drop */}
    <div
      style={{
        width: '3px',
        height: '4px',
        borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
        background: 'rgba(180, 20, 20, 0.5)',
        marginLeft: '-1px',
        opacity: 0,
        animation: `bloodDrop ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  </div>
);

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
  <svg width={size} height={size * 0.45} viewBox="0 0 60 27">
    {/* Body */}
    <ellipse cx="30" cy="14" rx="4" ry="3" fill={color} />
    {/* Left wing */}
    <path d="M26 14 Q16 5 3 10 Q8 12 11 15 Q14 17 18 16 Q22 15 25 14 Z" fill={color} opacity="0.85" />
    {/* Right wing */}
    <path d="M34 14 Q44 5 57 10 Q52 12 49 15 Q46 17 42 16 Q38 15 35 14 Z" fill={color} opacity="0.85" />
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
      {/* Blood drips from header — subtle, thin */}
      <BloodDrip left={30} delay={0} duration={9} height={45} />
      <BloodDrip left={55} delay={4} duration={11} height={55} />
      <BloodDrip left={78} delay={7} duration={10} height={40} />

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
