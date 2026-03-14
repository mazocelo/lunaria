import React from 'react';
import {
  X, BookOpen, Sword, MapPin, Users, Gem, Zap, Swords, Flag, Compass,
  ChevronDown, ChevronRight, GitCompareArrows
} from 'lucide-react';

const CompactSection = ({ title, icon: Icon, children, isLight, changed }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`rounded-lg border ${
      changed
        ? (isLight ? 'border-amber-300 bg-amber-50/50' : 'border-amber-500/30 bg-amber-500/5')
        : (isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-800/30')
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left font-fantasy font-semibold text-xs transition-all cursor-pointer ${
          isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-white hover:bg-slate-700/30'
        }`}
      >
        <Icon size={14} className="text-purple-400 flex-shrink-0" />
        <span className="flex-1">{title}</span>
        {changed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-modern">diferente</span>}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className={`px-3 pb-3 text-xs font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const MetadataHeader = ({ label, metadados, isLight, isActive }) => (
  <div className={`px-3 py-2 rounded-lg text-xs font-modern ${
    isActive
      ? (isLight ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/30')
      : (isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700')
  }`}>
    <div className={`font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{label}</div>
    {metadados && (
      <div className={`flex flex-wrap gap-x-3 gap-y-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        {metadados.modo && <span>Modo: <strong>{metadados.modo}</strong></span>}
        {metadados.temperatura != null && <span>Temp: <strong>{metadados.temperatura}</strong></span>}
        {metadados.modelo && <span>Modelo: <strong>{metadados.modelo}</strong></span>}
        {metadados.criado_em && <span>{new Date(metadados.criado_em).toLocaleString('pt-BR')}</span>}
        {metadados.versao != null && <span>v{metadados.versao}</span>}
      </div>
    )}
  </div>
);

const hasChanged = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

const RoteiroColumn = ({ roteiro, isLight }) => {
  if (!roteiro) return <p className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Sem dados</p>;

  return (
    <div className="space-y-1.5">
      {roteiro.sinopse && (
        <CompactSection title="Sinopse" icon={BookOpen} isLight={isLight}>
          <p className="whitespace-pre-line">{roteiro.sinopse}</p>
        </CompactSection>
      )}
      {roteiro.antagonista && (
        <CompactSection title={`Antagonista: ${roteiro.antagonista.nome || '?'}`} icon={Sword} isLight={isLight}>
          {roteiro.antagonista.titulo && <p className="font-semibold italic">{roteiro.antagonista.titulo}</p>}
          <p>{roteiro.antagonista.descricao}</p>
          {roteiro.antagonista.motivacao && <p><strong>Motivacao:</strong> {roteiro.antagonista.motivacao}</p>}
        </CompactSection>
      )}
      {roteiro.arcos?.length > 0 && (
        <CompactSection title={`Arcos (${roteiro.arcos.length})`} icon={Compass} isLight={isLight}>
          {roteiro.arcos.map((arco, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold">{arco.titulo || `Arco ${i + 1}`}</p>
              <p>{arco.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.locais?.length > 0 && (
        <CompactSection title={`Locais (${roteiro.locais.length})`} icon={MapPin} isLight={isLight}>
          {roteiro.locais.map((local, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold">{local.nome}</p>
              <p>{local.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.npcs?.length > 0 && (
        <CompactSection title={`NPCs (${roteiro.npcs.length})`} icon={Users} isLight={isLight}>
          {roteiro.npcs.map((npc, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold">{npc.nome}</p>
              <p>{npc.descricao || npc.papel}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.tesourosSegretos?.length > 0 && (
        <CompactSection title={`Tesouros (${roteiro.tesourosSegretos.length})`} icon={Gem} isLight={isLight}>
          {roteiro.tesourosSegretos.map((t, i) => (
            <div key={i} className="mb-1">
              <p className="font-semibold">{t.nome}</p>
              <p>{t.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.plotTwists?.length > 0 && (
        <CompactSection title={`Plot Twists (${roteiro.plotTwists.length})`} icon={Zap} isLight={isLight}>
          {roteiro.plotTwists.map((tw, i) => (
            <div key={i} className="mb-1">
              <p className="font-semibold">{tw.titulo || `Twist ${i + 1}`}</p>
              <p>{tw.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.encontrosChave?.length > 0 && (
        <CompactSection title={`Encontros (${roteiro.encontrosChave.length})`} icon={Swords} isLight={isLight}>
          {roteiro.encontrosChave.map((e, i) => (
            <div key={i} className="mb-1">
              <p className="font-semibold">{e.nome}</p>
              <p>{e.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
      {roteiro.desfechosPossiveis?.length > 0 && (
        <CompactSection title={`Desfechos (${roteiro.desfechosPossiveis.length})`} icon={Flag} isLight={isLight}>
          {roteiro.desfechosPossiveis.map((d, i) => (
            <div key={i} className="mb-1">
              <p className="font-semibold">{d.nome || d.titulo || `Desfecho ${i + 1}`}</p>
              <p>{d.descricao}</p>
            </div>
          ))}
        </CompactSection>
      )}
    </div>
  );
};

const SECTIONS = ['sinopse', 'antagonista', 'arcos', 'locais', 'npcs', 'tesourosSegretos', 'plotTwists', 'encontrosChave', 'desfechosPossiveis'];

const DiffSummary = ({ roteiroA, roteiroB, isLight }) => {
  if (!roteiroA || !roteiroB) return null;
  const diffs = SECTIONS.filter(s => hasChanged(roteiroA[s], roteiroB[s]));
  if (diffs.length === 0) return (
    <p className={`text-xs font-modern px-3 py-1.5 rounded ${isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400'}`}>
      Versoes identicas em todas as secoes.
    </p>
  );
  return (
    <p className={`text-xs font-modern px-3 py-1.5 rounded ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
      {diffs.length} {diffs.length === 1 ? 'secao diferente' : 'secoes diferentes'}: {diffs.join(', ')}
    </p>
  );
};

const RoteiroComparisonModal = ({ isOpen, onClose, roteiroAtivo, versaoComparacao, metadadosAtiva, metadadosComparacao, onAtivarVersao, isLight }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className={`relative w-full h-full max-w-6xl max-h-[90vh] mx-4 my-4 rounded-xl border flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/95 backdrop-blur-md border-purple-500/20'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GitCompareArrows size={20} className="text-purple-400" />
              <h2 className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Comparar Versoes</h2>
            </div>
            <button onClick={onClose} className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}>
              <X size={20} />
            </button>
          </div>
          <DiffSummary roteiroA={roteiroAtivo} roteiroB={versaoComparacao} isLight={isLight} />
        </div>

        {/* Body — two columns */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Active version */}
          <div className={`flex-1 overflow-y-auto p-4 border-r ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
            <MetadataHeader label="Versao Ativa" metadados={metadadosAtiva} isLight={isLight} isActive />
            <div className="mt-3">
              <RoteiroColumn roteiro={roteiroAtivo} isLight={isLight} />
            </div>
          </div>

          {/* Right: Comparison version */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <MetadataHeader label="Versao Comparada" metadados={metadadosComparacao} isLight={isLight} />
              </div>
              {onAtivarVersao && metadadosComparacao?.versao != null && (
                <button
                  onClick={() => { onAtivarVersao(); onClose(); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-modern font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-all cursor-pointer"
                >
                  Ativar esta versao
                </button>
              )}
            </div>
            <div className="mt-3">
              <RoteiroColumn roteiro={versaoComparacao} isLight={isLight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoteiroComparisonModal;
