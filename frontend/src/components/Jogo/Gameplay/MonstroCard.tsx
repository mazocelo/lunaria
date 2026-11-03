import type { ComponentType } from 'react';
import { Ghost, Skull, Sword, Trees, User, Waves, Bot, FlameKindling } from 'lucide-react';

const TIPO_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  besta: Ghost,
  'morto-vivo': Skull,
  demonio: FlameKindling,
  dragao: Waves,
  elemental: Waves,
  constructo: Bot,
  fada: Trees,
  aberracao: Ghost,
  humanoide: User,
  celestial: Ghost,
  gigante: Sword,
  monstrosity: Ghost,
  fiend: FlameKindling,
  plant: Trees,
};

interface MonstroStatusLabel {
  label: string;
  icon: string;
  textClass: string;
}

const MONSTRO_STATUS_LABELS: Record<string, MonstroStatusLabel> = {
  muito_fraco:  { label: 'MUITO FRACO',  icon: '\u26A0\uFE0F', textClass: 'text-yellow-400' },
  inconsciente: { label: 'INCONSCIENTE', icon: '\u{1F4A4}', textClass: 'text-orange-400' },
  quase_morto:  { label: 'QUASE MORTO',  icon: '\u{1F480}', textClass: 'text-red-400 animate-pulse' },
  morto:        { label: 'MORTO',        icon: '\u{1F480}', textClass: 'text-slate-500' },
};

export interface MonstroCardPayload {
  nome?: string;
  nivel?: number;
  tipo?: string;
  imagem?: string | null;
  hp_atual?: number;
  hp_max?: number;
  status?: string;
}

interface MonstroCardProps {
  monstro?: MonstroCardPayload | null;
  compact?: boolean;
  hpLabel?: string;
}

const MonstroCard = ({ monstro, compact = false, hpLabel = 'HP' }: MonstroCardProps) => {
  if (!monstro) return null;

  const hpAtual = monstro.hp_atual ?? 0;
  const hpMax = monstro.hp_max ?? 1;
  const hpPercentage = Math.max(0, (hpAtual / hpMax) * 100);
  const isDerrotado = monstro.status === 'derrotado' || monstro.status === 'morto' || hpAtual <= 0;
  const statusInfo = monstro.status ? MONSTRO_STATUS_LABELS[monstro.status] : undefined;
  const Icon = (monstro.tipo && TIPO_ICONS[monstro.tipo]) || Ghost;

  const hpColor = hpPercentage > 60
    ? 'from-green-500 to-green-400'
    : hpPercentage > 30
      ? 'from-yellow-500 to-yellow-400'
      : 'from-red-600 to-red-400';

  const woundedStyle = isDerrotado
    ? 'border-gray-600/20 opacity-40 grayscale'
    : monstro.status === 'quase_morto'
      ? 'border-red-500/50 bg-red-900/30 animate-pulse'
      : monstro.status === 'inconsciente'
        ? 'border-orange-500/40 bg-orange-900/20'
        : monstro.status === 'muito_fraco'
          ? 'border-yellow-500/40 bg-yellow-900/20'
          : hpPercentage <= 25
            ? 'border-red-500/40 bg-red-900/20'
            : hpPercentage <= 50
              ? 'border-yellow-500/40 bg-yellow-900/20'
              : 'border-red-500/30 bg-red-900/10';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${woundedStyle}`}>
        {monstro.imagem ? (
          <img src={monstro.imagem} alt={monstro.nome} className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-red-500/30" />
        ) : (
          <Icon size={14} className="text-red-300 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold truncate ${isDerrotado ? 'text-gray-500 line-through' : 'text-red-300'}`}>
              {monstro.nome}
            </span>
            <span className={`text-xs flex-shrink-0 ${isDerrotado ? 'text-gray-500' : statusInfo ? statusInfo.textClass : 'text-red-200'}`}>
              {isDerrotado
                ? `\u{1F480} ${statusInfo?.label || 'DERROTADO'}`
                : statusInfo
                  ? `${statusInfo.icon} ${statusInfo.label}`
                  : `${hpAtual}/${hpMax}`}
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1 mt-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>
        {isDerrotado && <Skull size={12} className="text-gray-400 flex-shrink-0" />}
      </div>
    );
  }

  const woundedStyleFull = isDerrotado
    ? 'border-gray-600/30 opacity-50 grayscale'
    : monstro.status === 'quase_morto'
      ? 'border-red-500/50 bg-red-900/30 hover:border-red-400/60 animate-pulse'
      : monstro.status === 'inconsciente'
        ? 'border-orange-500/40 bg-orange-900/20 hover:border-orange-400/60'
        : monstro.status === 'muito_fraco'
          ? 'border-yellow-500/40 bg-yellow-900/20 hover:border-yellow-400/60'
          : hpPercentage <= 25
            ? 'border-red-500/40 bg-red-900/20 hover:border-red-400/60'
            : hpPercentage <= 50
              ? 'border-yellow-500/40 bg-yellow-900/20 hover:border-yellow-400/60'
              : 'border-red-500/40 hover:border-red-400/60';

  return (
    <div className={`game-glass rounded-lg border p-3 transition-all duration-300 ${woundedStyleFull}`}>
      <div className="flex items-center space-x-2 mb-2">
        {monstro.imagem ? (
          <img src={monstro.imagem} alt={monstro.nome} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-red-500/30" />
        ) : (
          <Icon size={18} className="text-red-300" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-fantasy font-bold text-sm truncate ${
            isDerrotado ? 'text-gray-400 line-through' : 'text-red-300'
          }`}>
            {monstro.nome}
          </h4>
          <p className="text-xs text-gray-400">
            Nv.{monstro.nivel} · {monstro.tipo}
          </p>
        </div>
        {isDerrotado && <Skull size={16} className="text-gray-400" />}
      </div>

      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className={isDerrotado ? 'text-gray-500' : 'text-red-300'}>{hpLabel}</span>
          <span className={isDerrotado ? 'text-gray-500 font-bold' : statusInfo ? `${statusInfo.textClass} font-bold` : 'text-red-200'}>
            {isDerrotado
              ? `\u{1F480} ${statusInfo?.label || 'DERROTADO'}`
              : statusInfo
                ? `${statusInfo.icon} ${statusInfo.label}`
                : `${hpAtual}/${hpMax}`}
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MonstroCard;
