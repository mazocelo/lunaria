import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/theme';
import { useLocation } from 'react-router-dom';

/**
 * Gothic decorative elements — spider webs + animated bats.
 * Bats fly in front of content (high z-index), flap wings via CSS.
 */

interface BloodDripProps {
  left: number;
  delay?: number;
  duration?: number;
  height?: number;
}

const BloodDrip = ({ left, delay = 0, duration = 8, height = 60 }: BloodDripProps) => (
  <div
    className="fixed pointer-events-none z-[3]"
    style={{ left: `${left}%`, top: '56px' }}
  >
    {/* Drip trail */}
    <div
      style={{
        width: '1.5px',
        height: `${height}px`,
        background: `linear-gradient(to bottom, rgba(139,0,0,0.7), rgba(180,20,20,0.35) 60%, transparent)`,
        opacity: 0,
        animation: `bloodDrip ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
    {/* Drop */}
    <div
      style={{
        width: '4px',
        height: '6px',
        borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
        background: 'rgba(180, 20, 20, 0.55)',
        marginLeft: '-1.25px',
        opacity: 0,
        animation: `bloodDrop ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  </div>
);

interface SpiderWebProps {
  side?: 'left' | 'right';
  position?: 'top' | 'bottom';
  size?: number;
}

const SpiderWeb = ({ side = 'left', position = 'top', size = 140 }: SpiderWebProps) => {
  const isBottom = position === 'bottom';
  const isRight = side === 'right';
  const transforms: string[] = [];
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

interface BatSvgProps {
  size?: number;
  color?: string;
}

// Bat SVG — more detailed with wing membrane lines
const BatSvg = ({ size = 50, color = '#cc3333' }: BatSvgProps) => (
  <svg width={size} height={size * 0.45} viewBox="0 0 60 27">
    {/* Body */}
    <ellipse cx="30" cy="14" rx="4" ry="3" fill={color} />
    {/* Left wing */}
    <path d="M26 14 Q16 5 3 10 Q8 12 11 15 Q14 17 18 16 Q22 15 25 14 Z" fill={color} opacity="0.85" />
    {/* Right wing */}
    <path d="M34 14 Q44 5 57 10 Q52 12 49 15 Q46 17 42 16 Q38 15 35 14 Z" fill={color} opacity="0.85" />
  </svg>
);

interface BatSwarmProps {
  count?: number;
  trigger?: number;
}

interface BatInstance {
  id: number;
  y: number;
  duration: number;
  delay: number;
  size: number;
  flapSpeed: number;
  fromRight: boolean;
}

const BatSwarm = ({ count = 6, trigger }: BatSwarmProps) => {
  const [bats, setBats] = useState<BatInstance[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newBats: BatInstance[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      y: 5 + Math.random() * 30,
      duration: 2.5 + Math.random() * 2,
      delay: i * 0.3,
      size: 40 + Math.random() * 30,
      flapSpeed: 0.15 + Math.random() * 0.1,
      fromRight: i % 2 === 1,
    }));
    setBats(newBats);
    const timer = setTimeout(() => setBats([]), 8000);
    return () => clearTimeout(timer);
  }, [trigger, count]);

  return (
    <>
      {bats.map((bat) => (
        <div
          key={bat.id}
          className="fixed pointer-events-none z-[100]"
          style={{
            top: `${bat.y}%`,
            [bat.fromRight ? 'right' : 'left']: '-80px',
            animation: `${bat.fromRight ? 'batFlyRight' : 'batFlyFast'} ${bat.duration}s ease-in-out ${bat.delay}s forwards`,
            transform: bat.fromRight ? 'scaleX(-1)' : undefined,
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
    if (theme === 'gothic') setBatTrigger((t) => t + 1);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'gothic') return;
    setBatTrigger((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname.split('/').filter(Boolean)[0], theme]);

  if (theme !== 'gothic') return null;

  return createPortal(
    <>
      {/* Blood drips from header */}
      <BloodDrip left={18} delay={0} duration={9} height={65} />
      <BloodDrip left={24} delay={5} duration={12} height={55} />
      <BloodDrip left={30} delay={2} duration={10} height={70} />
      <BloodDrip left={36} delay={8} duration={11} height={50} />
      <BloodDrip left={42} delay={3.5} duration={13} height={60} />
      <BloodDrip left={48} delay={1} duration={9.5} height={75} />
      <BloodDrip left={54} delay={6.5} duration={11.5} height={55} />
      <BloodDrip left={60} delay={4} duration={10} height={65} />
      <BloodDrip left={66} delay={7} duration={12.5} height={50} />
      <BloodDrip left={72} delay={2.5} duration={9} height={70} />
      <BloodDrip left={78} delay={9} duration={11} height={60} />
      <BloodDrip left={84} delay={1.5} duration={10.5} height={55} />
      <BloodDrip left={90} delay={6} duration={13} height={65} />
      <BloodDrip left={95} delay={4.5} duration={9.5} height={50} />

      {/* Webs */}
      <SpiderWeb side="left" position="top" size={160} />
      <SpiderWeb side="right" position="top" size={130} />
      <SpiderWeb side="left" position="bottom" size={100} />
      <SpiderWeb side="right" position="bottom" size={110} />

      {/* Bat swarm on navigation/theme change only — no ambient */}
      <BatSwarm count={4} trigger={batTrigger} />
    </>,
    document.body
  );
};

export default GothicDecorations;
