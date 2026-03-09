import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import Combobox from '../../../components/form/Combobox';
import MultiSelect from '../../../components/form/MultiSelect';
import { Pencil, User, BarChart3, Sparkles, Wand2, ScrollText, BookOpen, Save, Loader2 } from 'lucide-react';

const PONTOS_MAXIMO = 75;

const atributosConfig = [
  { key: 'forca', label: 'Forca' },
  { key: 'inteligencia', label: 'Inteligencia' },
  { key: 'constituicao', label: 'Constituicao' },
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'carisma', label: 'Carisma' },
];

const EditarPersonagemView = ({
  nome,
  setNome,
  raca,
  setRaca,
  classe,
  setClasse,
  backgroundTipo,
  setBackgroundTipo,
  background,
  setBackground,
  historias,
  setHistorias,
  atributos,
  setAtributo,
  vantagens,
  setVantagens,
  pontosDistribuidos,
  racasDisponiveis,
  classesDisponiveis,
  vantagensDisponiveis,
  historiasDisponiveis,
  loadingOpcoes,
  loadingVantagens,
  loadingHistorias,
  loading,
  error,
  atualizarPersonagem,
  clearError,
  navigate,
  isLight,
}) => {
  if (loading && !nome) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-purple-400 mb-4" />
        <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Carregando personagem...
        </span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Pencil size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Personagem
        </h1>
        <p className="text-slate-400 font-modern">
          Atualize a ficha do seu personagem
        </p>
      </div>

      <form onSubmit={atualizarPersonagem} className="space-y-8">
        {/* Error */}
        {error && (
          <div className="card-rpg p-4 bg-red-500/20 border border-red-500/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Informacoes Basicas
            </h2>
          </div>

          <InputSimples
            label="Nome do Personagem"
            name="nome"
            onChange={e => setNome(e.target.value)}
            value={nome}
            placeholder="Digite o nome do seu heroi..."
            required
          />

          {loadingOpcoes ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando opcoes...</span>
            </div>
          ) : (
            <>
              <Combobox
                label="Raca"
                options={(racasDisponiveis || []).map(r => ({ value: String(r.id), label: r.nome }))}
                selected={raca}
                onChange={(value) => setRaca(value)}
                placeholder="Buscar raca..."
                emptyText="Nenhuma raca encontrada."
              />

              <Combobox
                label="Classe"
                options={(classesDisponiveis || []).map(c => ({ value: String(c.id), label: c.nome }))}
                selected={classe}
                onChange={(value) => setClasse(value)}
                placeholder="Buscar classe..."
                emptyText="Nenhuma classe encontrada."
              />
            </>
          )}
        </div>

        {/* Section 2: Attributes */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
                <BarChart3 size={16} className="text-white" />
              </div>
              <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Atributos
              </h2>
            </div>
            <div className={`font-modern text-sm font-semibold ${
              pontosDistribuidos > PONTOS_MAXIMO
                ? 'text-red-400'
                : pontosDistribuidos === PONTOS_MAXIMO
                  ? 'text-green-400'
                  : 'text-cyan-400'
            }`}>
              {pontosDistribuidos || 0} / {PONTOS_MAXIMO} pontos
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {atributosConfig.map(attr => (
              <InputSimples
                key={attr.key}
                label={attr.label}
                type="number"
                name={attr.key}
                value={atributos?.[attr.key] ?? ''}
                onChange={e => setAtributo(attr.key, e.target.value)}
                min={1}
                max={20}
                placeholder="10"
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-modern">
            Distribua pontos entre 1 e 20 para cada atributo (maximo {PONTOS_MAXIMO} pontos no total)
          </p>
        </div>

        {/* Section 3: Vantagens & Desvantagens */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Vantagens & Desvantagens
            </h2>
          </div>

          {loadingVantagens ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando vantagens...</span>
            </div>
          ) : (
            <MultiSelect
              label="Selecione Vantagens e Desvantagens"
              options={(vantagensDisponiveis || []).map(v => ({
                value: String(v.id),
                label: `${v.nome} (${v.custo > 0 ? '+' : ''}${v.custo})`
              }))}
              selected={vantagens || []}
              onChange={(selected) => setVantagens(Array.isArray(selected) ? selected : [])}
              max={5}
              placeholder="Buscar vantagens..."
              emptyText="Nenhuma vantagem encontrada."
            />
          )}
          <p className="text-xs text-slate-400 font-modern">
            Selecione ate 5 vantagens e desvantagens para personalizar seu personagem
          </p>
        </div>

        {/* Section 4: Background */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ScrollText size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Background
            </h2>
          </div>

          <div className="flex space-x-3 mb-4">
            <button
              type="button"
              onClick={() => setBackgroundTipo('guiado')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-modern text-sm font-semibold transition-all cursor-pointer ${
                backgroundTipo === 'guiado'
                  ? 'gradient-primary text-white'
                  : isLight
                    ? 'glass-light text-slate-600 hover:bg-slate-100/50'
                    : 'glass text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Wand2 size={14} />
              Gerar com IA
            </button>
            <button
              type="button"
              onClick={() => setBackgroundTipo('personalizado')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-modern text-sm font-semibold transition-all cursor-pointer ${
                backgroundTipo === 'personalizado'
                  ? 'gradient-primary text-white'
                  : isLight
                    ? 'glass-light text-slate-600 hover:bg-slate-100/50'
                    : 'glass text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <ScrollText size={14} />
              Escrever manualmente
            </button>
          </div>

          {backgroundTipo === 'guiado' ? (
            <div className="space-y-3">
              <label className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Descreva o que a IA deve criar
              </label>
              <textarea
                value={background}
                onChange={e => setBackground(e.target.value)}
                placeholder="Ex: Um guerreiro que perdeu sua familia em uma guerra e busca vinganca... ou apenas 'nobre caido em desgraca'"
                rows={3}
                className={`w-full px-4 py-3 rounded-lg font-modern border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none
                  ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'}`}
              />
              <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                A IA vai criar o background usando seu prompt, atributos, classe, raca, vantagens e equipamentos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Escreva o background do personagem
              </label>
              <textarea
                value={background}
                onChange={e => setBackground(e.target.value)}
                placeholder="Conte a historia de origem do seu personagem..."
                rows={5}
                className={`w-full px-4 py-3 rounded-lg font-modern border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none
                  ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'}`}
              />
            </div>
          )}
        </div>

        {/* Section 6: Historias */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Historias
            </h2>
          </div>

          {loadingHistorias ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando historias...</span>
            </div>
          ) : (historiasDisponiveis || []).length > 0 ? (
            <MultiSelect
              label="Vincular a Historias (opcional)"
              options={historiasDisponiveis.map(h => ({ value: String(h.id), label: h.nome }))}
              selected={historias || []}
              onChange={(selected) => setHistorias(Array.isArray(selected) ? selected : [])}
              max={3}
              placeholder="Buscar historias..."
              emptyText="Nenhuma historia encontrada."
            />
          ) : (
            <p className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-modern text-sm italic`}>
              Nenhuma historia disponivel. Crie uma historia primeiro.
            </p>
          )}
          <p className="text-xs text-slate-400 font-modern">
            Vincule seu personagem a ate 3 historias existentes
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/personagens')}
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
                <span>Salvando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save size={16} />
                <span>Salvar Alteracoes</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarPersonagemView;
