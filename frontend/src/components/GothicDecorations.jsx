import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { useLocation } from 'react-router-dom';

/**
 * Gothic decorative elements — spider webs + bats.
 * Bats appear on theme change and page navigation.
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
      {/* Radial threads */}
      {[0, 12, 24, 36, 48, 60, 72, 84, 90].map(angle => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1="0" y1="0"
            x2={Math.cos(rad) * 118}
            y2={Math.sin(rad) * 118}
            stroke="#d4c4b0"
            strokeWidth="0.6"
          />
        );
      })}
      {/* Concentric arcs — more layers */}
      {[20, 38, 55, 72, 88, 105].map(r => (
        <path
          key={r}
          d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`}
          fill="none"
          stroke="#d4c4b0"
          strokeWidth="0.5"
        />
      ))}
      {/* Drooping thread */}
      <path
        d="M 60 0 Q 55 30 50 45 Q 48 55 52 60"
        fill="none"
        stroke="#d4c4b0"
        strokeWidth="0.4"
      />
    </svg>
  );
};

const BatSwarm = ({ count = 3, trigger }) => {
  const [bats, setBats] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    // Spawn bats with staggered delays
    const newBats = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      y: 8 + Math.random() * 25,
      duration: 3 + Math.random() * 2,
      delay: i * 0.4,
      size: 30 + Math.random() * 20,
    }));
    setBats(newBats);
    // Clean up after animation
    const timer = setTimeout(() => setBats([]), 8000);
    return () => clearTimeout(timer);
  }, [trigger, count]);

  return (
    <>
      {bats.map(bat => (
        <div
          key={bat.id}
          className="fixed pointer-events-none z-[50]"
          style={{
            top: `${bat.y}%`,
            left: '-60px',
            animation: `batFlyFast ${bat.duration}s ease-in-out ${bat.delay}s forwards`,
            opacity: 0.35,
          }}
        >
          <svg width={bat.size} height={bat.size * 0.5} viewBox="0 0 40 20" fill="#2a0a0a">
            <ellipse cx="20" cy="12" rx="4" ry="3" />
            <path d="M16 12 Q8 4 2 8 Q6 10 8 12 Q10 14 14 13 Z" />
            <path d="M24 12 Q32 4 38 8 Q34 10 32 12 Q30 14 26 13 Z" />
            <path d="M18 9 L17 6 L19 8 Z" />
            <path d="M22 9 L23 6 L21 8 Z" />
          </svg>
        </div>
      ))}
    </>
  );
};

const GothicDecorations = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const [batTrigger, setBatTrigger] = useState(0);

  // Trigger bats on theme change to gothic
  useEffect(() => {
    if (theme === 'gothic') setBatTrigger(t => t + 1);
  }, [theme]);

  // Trigger bats on page navigation (top-level only)
  useEffect(() => {
    if (theme !== 'gothic') return;
    const path = location.pathname.split('/').filter(Boolean)[0] || '';
    setBatTrigger(t => t + 1);
  }, [location.pathname.split('/').filter(Boolean)[0]]);

  if (theme !== 'gothic') return null;

  return (
    <>
      {/* Webs in all 4 corners */}
      <SpiderWeb side="left" position="top" size={160} />
      <SpiderWeb side="right" position="top" size={130} />
      <SpiderWeb side="left" position="bottom" size={100} />
      <SpiderWeb side="right" position="bottom" size={110} />

      {/* Ambient bats (slow, always) */}
      <div className="fixed pointer-events-none z-[2]" style={{ top: '15%', animation: 'batFly 45s linear 10s infinite', opacity: 0.15 }}>
        <svg width="35" height="18" viewBox="0 0 40 20" fill="#2a0a0a">
          <ellipse cx="20" cy="12" rx="4" ry="3" />
          <path d="M16 12 Q8 4 2 8 Q6 10 8 12 Q10 14 14 13 Z" />
          <path d="M24 12 Q32 4 38 8 Q34 10 32 12 Q30 14 26 13 Z" />
          <path d="M18 9 L17 6 L19 8 Z" />
          <path d="M22 9 L23 6 L21 8 Z" />
        </svg>
      </div>

      {/* Bat swarm on navigation/theme change */}
      <BatSwarm count={4} trigger={batTrigger} />
    </>
  );
};

export default GothicDecorations;
