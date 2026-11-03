export interface ElementColorEntry {
  border: string;
  glow: string;
  bg: string;
  bgLight: string;
  text: string;
  textLight: string;
}

export const ELEMENT_COLORS: Record<string, ElementColorEntry> = {
  fogo:   { border: '#f97316', glow: 'rgba(249,115,22,0.35)', bg: 'rgba(124,45,18,0.20)',  bgLight: 'rgba(249,115,22,0.08)', text: '#fb923c', textLight: '#c2410c' },
  agua:   { border: '#3b82f6', glow: 'rgba(59,130,246,0.35)',  bg: 'rgba(30,58,138,0.20)',  bgLight: 'rgba(59,130,246,0.08)', text: '#60a5fa', textLight: '#1d4ed8' },
  terra:  { border: '#10b981', glow: 'rgba(16,185,129,0.35)',  bg: 'rgba(6,78,59,0.20)',    bgLight: 'rgba(16,185,129,0.08)', text: '#34d399', textLight: '#047857' },
  ar:     { border: '#38bdf8', glow: 'rgba(56,189,248,0.35)',  bg: 'rgba(12,74,110,0.20)',  bgLight: 'rgba(56,189,248,0.08)', text: '#7dd3fc', textLight: '#0284c7' },
  luz:    { border: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  bg: 'rgba(120,53,15,0.20)',  bgLight: 'rgba(251,191,36,0.08)', text: '#fcd34d', textLight: '#b45309' },
  trevas: { border: '#a855f7', glow: 'rgba(168,85,247,0.35)',  bg: 'rgba(88,28,135,0.20)',  bgLight: 'rgba(168,85,247,0.08)', text: '#c084fc', textLight: '#7e22ce' },
};
