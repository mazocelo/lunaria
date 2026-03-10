import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import Selector from '../../../components/form/Selector';
import ImageGenerator from '../../../components/form/ImageGenerator';
import { BookOpen, Sparkles, Lightbulb, Loader2 } from 'lucide-react';

const NovaHistoriaView = ({
  // Form data
  nome,
  temasSelecionados,
  maximo_de_participantes,
  descricao,
  mestreSelecionado,
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
  handleMestreChange,
  criarHistoria,
  handleCancelar,
  imagem,
  setImagem,
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

        <ImageGenerator
          imageUrl={imagem}
          onImageGenerated={setImagem}
          entityType="historia"
          entityData={{ nome, temas: temasSelecionados?.map(id => temas?.find(t => t.id === id)?.nome).filter(Boolean).join(', '), descricao }}
          isLight={isLight}
        />

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
              <li>• Escolha um nome memoravel e descritivo</li>
              <li>• Selecione temas que combinem com sua narrativa</li>
              <li>• Considere o numero ideal de jogadores para sua historia</li>
              <li>• Pense na progressao e desenvolvimento dos personagens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovaHistoriaView;
