import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PersonagemPreviewCard from '../../../../components/PersonagemPreviewCard.jsx';

const WizardPreview = ({
  // Personagem data
  nome,
  racaId,
  classeId,
  atributos,
  vantagensIds,
  desvantagensIds,

  // Catálogos
  racasDisponiveis,
  classesDisponiveis,
  vantagensDisponiveis,

  // Actions
  removerSelecao,

  // State
  isLight,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  // Combinar vantagens+desvantagens para o preview card
  const allSelecoes = [...vantagensIds, ...desvantagensIds];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Toggle mobile */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className={`flex items-center justify-between px-4 py-2 md:hidden cursor-pointer ${
          isLight ? 'bg-white/80 border-b border-slate-200' : 'bg-slate-900/80 border-b border-slate-700/50'
        }`}
      >
        <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Ficha do Personagem
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <div className={`${expanded ? '' : 'hidden md:block'} p-4 space-y-4`}>
        {/* Preview Card */}
        <PersonagemPreviewCard
          nome={nome}
          raca={racaId}
          classe={classeId}
          atributos={atributos}
          vantagensSelecionadas={allSelecoes}
          vantagensDisponiveis={vantagensDisponiveis}
          racasDisponiveis={racasDisponiveis}
          classesDisponiveis={classesDisponiveis}
        />

        {/* Seleções atuais (vantagens/desvantagens) */}
        {(vantagensIds.length > 0 || desvantagensIds.length > 0) && (
          <div className={`rounded-lg border p-3 ${
            isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
          }`}>
            <h4 className={`text-xs font-modern font-semibold uppercase tracking-wider mb-2 ${
              isLight ? 'text-slate-600' : 'text-slate-500'
            }`}>
              Seleções
            </h4>
            <div className="flex flex-wrap gap-1">
              {vantagensIds.map(id => {
                const item = vantagensDisponiveis.find(v => v.id === id && v.tipo !== 'desvantagem');
                if (!item) return null;
                return (
                  <button
                    key={`v-${id}`}
                    onClick={() => removerSelecao('vantagem', id)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
                    title="Clique para remover"
                  >
                    {item.nome} ×
                  </button>
                );
              })}
              {desvantagensIds.map(id => {
                const item = vantagensDisponiveis.find(d => d.id === id && d.tipo === 'desvantagem');
                if (!item) return null;
                return (
                  <button
                    key={`d-${id}`}
                    onClick={() => removerSelecao('desvantagem', id)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 hover:bg-slate-500/15 hover:text-slate-400 transition-colors cursor-pointer"
                    title="Clique para remover"
                  >
                    {item.nome} ×
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardPreview;
