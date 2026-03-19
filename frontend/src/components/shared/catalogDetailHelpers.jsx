import React from 'react';

// ===================================================
// RARIDADE CONFIG — 8 levels (from equipamento-ver)
// ===================================================

export const RARIDADE_CONFIG = {
  'Comum': {
    color: 'slate',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeLight: 'bg-gray-100 text-gray-700 border-gray-300',
    accent: '#64748b',
    glow: 'rgba(100, 116, 139, 0.2)',
    gradient: 'radial-gradient(ellipse at top, rgba(100,116,139,0.15), transparent 70%)',
  },
  'Incomum': {
    color: 'green',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    badgeLight: 'bg-green-100 text-green-700 border-green-300',
    accent: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.25)',
    gradient: 'radial-gradient(ellipse at top, rgba(34,197,94,0.2), transparent 70%)',
  },
  'Raro': {
    color: 'blue',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeLight: 'bg-blue-100 text-blue-700 border-blue-300',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
    gradient: 'radial-gradient(ellipse at top, rgba(59,130,246,0.2), transparent 70%)',
  },
  'Muito Raro': {
    color: 'purple',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeLight: 'bg-purple-100 text-purple-700 border-purple-300',
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(139,92,246,0.25), transparent 70%)',
  },
  'Épico': {
    color: 'orange',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    badgeLight: 'bg-orange-100 text-orange-700 border-orange-300',
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(249,115,22,0.25), transparent 70%)',
  },
  'Lendário': {
    color: 'amber',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    badgeLight: 'bg-amber-100 text-amber-700 border-amber-300',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(245,158,11,0.25), transparent 70%)',
  },
  'Variável': {
    color: 'slate',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeLight: 'bg-slate-100 text-slate-700 border-slate-300',
    accent: '#64748b',
    glow: 'rgba(100, 116, 139, 0.2)',
    gradient: 'radial-gradient(ellipse at top, rgba(100,116,139,0.15), transparent 70%)',
  },
  'Artefato': {
    color: 'red',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    badgeLight: 'bg-red-100 text-red-700 border-red-300',
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(239,68,68,0.25), transparent 70%)',
  },
};

export const getRaridadeConfig = (nome) => RARIDADE_CONFIG[nome] || RARIDADE_CONFIG['Comum'];

// ===================================================
// FORMAT HELPERS
// ===================================================

export const formatJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return val; }
  }
  if (typeof val === 'object' && Object.keys(val).length === 0) return null;
  return val;
};

export const formatBonusDisplay = (bonus) => {
  const parsed = formatJson(bonus);
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    return parsed.filter(b => b && typeof b === 'object').map((b) => {
      return Object.entries(b).map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`).join(', ');
    }).filter(Boolean);
  }
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`);
  }
  return [String(parsed)];
};

export const formatRequisitosDisplay = (requisitos) => {
  const parsed = formatJson(requisitos);
  if (!parsed) return null;
  if (typeof parsed === 'object') return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`);
  return [String(parsed)];
};

export const formatObjectDisplay = (obj) => {
  const parsed = formatJson(obj);
  if (!parsed) return null;
  if (typeof parsed === 'object') return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
  return [String(parsed)];
};

// ===================================================
// SUB-COMPONENTS
// ===================================================

export const StatRow = ({ icon: Icon, label, children, isLight }) => (
  <div className={`flex items-start gap-3 py-3 border-b border-dashed last:border-0 ${
    isLight ? 'border-slate-200/70' : 'border-slate-700/50'
  }`}>
    <Icon size={14} className={`mt-0.5 flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
    <div className="flex-1 min-w-0">
      <span className={`text-[10px] uppercase tracking-widest font-modern block mb-1 ${
        isLight ? 'text-slate-400' : 'text-slate-500'
      }`}>{label}</span>
      <div className={`text-sm font-modern ${isLight ? 'text-slate-800' : 'text-white'}`}>
        {children}
      </div>
    </div>
  </div>
);

export const ChipGroup = ({ items, colorClass }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item, i) => (
      <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-modern ${colorClass}`}>
        {item}
      </span>
    ))}
  </div>
);

export const AtributoBar = ({ label, value, max = 20, color, isLight }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-modern w-12 text-right ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease-out' }} />
      </div>
      <span className={`text-xs font-mono font-semibold w-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>{value}</span>
    </div>
  );
};
