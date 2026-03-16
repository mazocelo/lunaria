import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import Selector from '../../../components/form/Selector';
import { BookOpen, Sparkles, Lightbulb, Loader2, ScrollText, Gauge, Hourglass, Swords } from 'lucide-react';
import {
  OPCOES_MAX_ACOES_TURNO,
  OPCOES_ORCAMENTO_BEATS,
  VELOCIDADES_NARRATIVA
} from '../../../utils/historiaConfig.js';

const PROMPT_SUGGESTIONS = [
  'Uma maldição antiga desperta em uma floresta proibida. Os aventureiros devem encontrar a fonte antes que ela consuma o reino.',
  'Piratas descobrem um mapa para uma ilha que aparece apenas durante eclipses. Lá, um tesouro amaldiçoado aguarda.',
  'Uma cidade flutuante está perdendo altitude lentamente. Os heróis precisam descobrir a sabotagem antes que ela caia.',
  'Um torneio de gladiadores esconde uma conspiração para assassinar o rei. Os participantes são peões ou salvadores?',
  'Portais dimensionais estão se abrindo aleatoriamente, trazendo criaturas de outros planos. A causa está nas ruínas de um mago louco.',
];

const NovaHistoriaView = ({
  // Form data
  nome,
  temasSelecionados,
  maximo_de_participantes,
  descricao,
  mestreSelecionado,
  velocidadeNarrativa,
  orcamentoDeBeats,
  maxAcoesPorTurno,
  nomeError,
  loading,
  error,
  isLight,

  // Options
  temas,
  mestres,

  // Handlers
  handleNomeChange,
  handleNomeBlur,
  handleTemasChange,
  handleMaxParticipantesChange,
  handleDescricaoChange,
  handleMestreChange,
  handleVelocidadeNarrativaChange,
  handleOrcamentoDeBeatsChange,
  handleMaxAcoesPorTurnoChange,
  criarHistoria,
  handleCancelar,
  publica,
  setPublica,
}) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <BookOpen size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Nova Historia
        </h1>
        <p className="text-slate-400 font-modern">
          De vida a uma nova aventura epica
        </p>
      </div>

      <form onSubmit={criarHistoria} className="card-rpg space-y-6">
        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-700' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <InputSimples
          label="Nome da Historia"
          name="nome"
          onChange={handleNomeChange}
          onBlur={handleNomeBlur}
          value={nome}
          placeholder="Digite o nome da sua aventura..."
          error={nomeError}
          required
        />

        <Selector
          label="Escolha os Temas"
          options={temas?.map((tema) => ({ value: tema.id, label: tema.nome })) || []}
          selected={temasSelecionados}
          onChange={handleTemasChange}
          type="multiple"
          max={3}
          containerClass="mb-2"
        />
        <p className="text-xs text-slate-400 mt-2 font-modern">
          Selecione ate 3 temas para categorizar sua historia
        </p>

        {/* Prompt da Aventura */}
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            <ScrollText size={16} className="text-purple-400" />
            Descreva sua aventura (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={handleDescricaoChange}
            rows={4}
            placeholder="Descreva a premissa da sua aventura... Ex: Um reino assolado por dragões onde os heróis devem encontrar as 3 relíquias ancestrais para selar o portal demoníaco."
            className={`w-full px-4 py-3 rounded-lg border text-sm font-modern transition-colors resize-none
              ${isLight
                ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-purple-400'}
              focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Quanto mais detalhado, melhor sera o prologo e o roteiro gerados pela IA
        </p>

          {/* Sugestoes de prompt */}
          {!descricao && (
            <div className="mt-1">
              <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Precisa de inspiracao? Clique em uma sugestao:
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((sugestao, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDescricaoChange({ target: { value: sugestao } })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer text-left
                      ${isLight
                        ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                        : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}
                  >
                    {sugestao.length > 80 ? sugestao.substring(0, 80) + '...' : sugestao}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Gauge size={16} className="text-cyan-400" />
              Velocidade narrativa
            </label>
            <select
              value={velocidadeNarrativa}
              onChange={handleVelocidadeNarrativaChange}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm font-modern transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                  : 'bg-slate-800 border-slate-600 text-slate-200 focus:border-purple-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              {VELOCIDADES_NARRATIVA.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
              ))}
            </select>
            <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {VELOCIDADES_NARRATIVA.find((opcao) => opcao.value === velocidadeNarrativa)?.desc}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Hourglass size={16} className="text-amber-400" />
              Orcamento de beats
            </label>
            <select
              value={orcamentoDeBeats}
              onChange={handleOrcamentoDeBeatsChange}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm font-modern transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                  : 'bg-slate-800 border-slate-600 text-slate-200 focus:border-purple-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              {OPCOES_ORCAMENTO_BEATS.map((valor) => (
                <option key={valor} value={valor}>{valor} beats</option>
              ))}
            </select>
            <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Define o tamanho esperado da aventura e ajuda o Mestre a nao enrolar nem correr demais.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Swords size={16} className="text-rose-400" />
              Max acoes por turno
            </label>
            <select
              value={maxAcoesPorTurno}
              onChange={handleMaxAcoesPorTurnoChange}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm font-modern transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                  : 'bg-slate-800 border-slate-600 text-slate-200 focus:border-purple-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            >
              {OPCOES_MAX_ACOES_TURNO.map((valor) => (
                <option key={valor} value={valor}>{valor} respostas</option>
              ))}
            </select>
            <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Limite duro de respostas do Mestre dentro de cada turno do jogador.
            </p>
          </div>
        </div>

        <InputSimples
          label="Maximo de Participantes"
          type="number"
          min={2}
          max={10}
          value={maximo_de_participantes}
          onChange={handleMaxParticipantesChange}
          placeholder="Numero de jogadores"
          required
        />
        <p className="text-xs text-slate-400 mt-2 font-modern">
          Recomendamos entre 2 e 10 jogadores para uma experiencia ideal
        </p>

        <div className="flex flex-col gap-2 mb-2">
          <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            Mestre (opcional)
          </label>
          <select
            value={mestreSelecionado || ''}
            onChange={(e) => handleMestreChange(e.target.value ? Number(e.target.value) : null)}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm font-modern transition-colors
              ${isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                : 'bg-slate-800 border-slate-600 text-slate-200 focus:border-purple-400'}
              focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          >
            <option value="">Mestre Padrao</option>
            {(mestres || []).map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 font-modern">
            Se nenhum mestre for selecionado, sera usado um mestre padrao
          </p>
        </div>

        {/* Toggle pública */}
        <div className="flex items-center justify-between">
          <div>
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Aventura publica
            </label>
            <p className="text-xs text-slate-400 font-modern">
              Permite que outros jogadores encontrem e solicitem entrada
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPublica(!publica)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
              publica ? 'bg-purple-600' : isLight ? 'bg-slate-300' : 'bg-slate-600'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              publica ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Botoes de acao */}
        <div className="flex space-x-4 pt-4">
          <Button
            variant="ghost"
            onClick={handleCancelar}
            className="flex-1"
            type="button"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Criando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles size={16} />
                <span>Criar Historia</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Dicas */}
      <div className="mt-6 card-rpg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`font-semibold font-modern mb-1 ${isLight ? 'text-slate-700' : 'text-white'}`}>Dicas para uma boa historia</h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Descreva sua aventura com detalhes — a IA usara isso para gerar prologo e roteiro</li>
              <li>• Mencione viloes, locais, conflitos ou misterios que deseja na historia</li>
              <li>• Selecione temas que combinem com sua narrativa</li>
              <li>• Apos criar, gere o Roteiro com IA na pagina da historia para um guia completo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovaHistoriaView;
