import React from 'react';
import { Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import PersonagemPreviewCard from '../../../../components/PersonagemPreviewCard.jsx';
import AttributeDistributor from './AttributeDistributor.jsx';

const WizardPreview = ({
  // Personagem data
  nome,
  racaId,
  classeId,
  atributos,
  vantagensIds,
  desvantagensIds,
  pontosDistribuidos,
  pontosRestantes,
  pontosTotais,
  atributosSugeridos,

  // Catálogos
  racasDisponiveis,
  classesDisponiveis,
  vantagensDisponiveis,

  // Actions
  setAtributo,
  aplicarAtributosSugeridos,
  salvarPersonagem,
  removerSelecao,

  // State
  etapaAtual,
  salvando,
  gerandoBackground,
  isLight,
}) => {
  const [expanded, setExpanded] = React.useState(true);
  const showAtributos = ['atributos', 'resumo', 'refinamento'].includes(etapaAtual);
  const showSave = etapaAtual === 'refinamento';

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
              isLight ? 'text-slate-500' : 'text-slate-500'
            }`}>
              Seleções
            </h4>
            <div className="flex flex-wrap gap-1">
              {vantagensIds.map(id => {
                const item = vantagensDisponiveis.find(v => v.id === id);
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
                const item = vantagensDisponiveis.find(d => d.id === id);
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

        {/* Attribute Distributor */}
        {showAtributos && (
          <AttributeDistributor
            atributos={atributos}
            setAtributo={setAtributo}
            pontosDistribuidos={pontosDistribuidos}
            pontosRestantes={pontosRestantes}
            pontosTotais={pontosTotais}
            atributosSugeridos={atributosSugeridos}
            aplicarAtributosSugeridos={aplicarAtributosSugeridos}
            isLight={isLight}
          />
        )}

        {/* Save Button */}
        {showSave && (
          <button
            onClick={salvarPersonagem}
            disabled={salvando || gerandoBackground || pontosRestantes !== 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-fantasy font-bold text-sm transition-all cursor-pointer ${
              salvando || gerandoBackground
                ? 'bg-slate-600 text-slate-400 cursor-wait'
                : pontosRestantes !== 0
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20'
            }`}
          >
            {salvando || gerandoBackground ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {gerandoBackground ? 'Gerando background...' : 'Salvando...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {pontosRestantes !== 0
                  ? `Distribua todos os pontos (${pontosRestantes} restantes)`
                  : 'Criar Personagem'
                }
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WizardPreview;
