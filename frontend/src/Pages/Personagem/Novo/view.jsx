import React, { useEffect, useState } from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import Combobox from '../../../components/form/Combobox';
import MultiSelect from '../../../components/form/MultiSelect';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { novoPersonagemViewModel } from './viewmodel';
import { useTheme } from '../../../contexts/theme.jsx';
import { Badge } from '../../../components/shared';
import { User, BarChart3, Sparkles, Swords, ScrollText, BookOpen, Lightbulb, Check, Loader2 } from 'lucide-react';

const PONTOS_MAXIMO = 75;

const raridadeVariant = {
  'Comum': 'slate',
  'Incomum': 'green',
  'Raro': 'blue',
  'Muito Raro': 'purple',
  'Lendario': 'amber',
  'Artefato': 'red',
};

const atributosConfig = [
  { key: 'forca', label: 'Força' },
  { key: 'inteligencia', label: 'Inteligência' },
  { key: 'constituicao', label: 'Constituição' },
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'carisma', label: 'Carisma' },
];

const NovoPersonagemView = () => {
  const vm = useViewModel(novoPersonagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadOpcoes();
    vm.loadVantagens();
    vm.loadHistorias();
    vm.loadEquipamentos();
    vm.clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.criarPersonagem(() => navigate('/personagens'));
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <User size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Novo Personagem
        </h1>
        <p className="text-slate-400 font-modern">
          Dê vida a um novo herói épico
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error */}
        {vm.error && (
          <div className="card-rpg p-4 bg-red-500/20 border border-red-500/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p>
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
              Informações Básicas
            </h2>
          </div>

          <InputSimples
            label="Nome do Personagem"
            name="nome"
            onChange={e => vm.setNome(e.target.value)}
            value={vm.nome}
            placeholder="Digite o nome do seu herói..."
            required
          />

          {vm.loadingOpcoes ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando opções...</span>
            </div>
          ) : (
            <>
              <Combobox
                label="Raça"
                options={(vm.racasDisponiveis || []).map(r => ({ value: String(r.id), label: r.nome }))}
                selected={vm.raca}
                onChange={(value) => vm.setRaca(value)}
                placeholder="Buscar raça..."
                emptyText="Nenhuma raça encontrada."
              />

              <Combobox
                label="Classe"
                options={(vm.classesDisponiveis || []).map(c => ({ value: String(c.id), label: c.nome }))}
                selected={vm.classe}
                onChange={(value) => vm.setClasse(value)}
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
              vm.pontosDistribuidos > PONTOS_MAXIMO
                ? 'text-red-400'
                : vm.pontosDistribuidos === PONTOS_MAXIMO
                  ? 'text-green-400'
                  : 'text-cyan-400'
            }`}>
              {vm.pontosDistribuidos || 0} / {PONTOS_MAXIMO} pontos
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {atributosConfig.map(attr => (
              <InputSimples
                key={attr.key}
                label={attr.label}
                type="number"
                name={attr.key}
                value={vm.atributos?.[attr.key] ?? ''}
                onChange={e => vm.setAtributo(attr.key, e.target.value)}
                min={1}
                max={20}
                placeholder="10"
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-modern">
            Distribua pontos entre 1 e 20 para cada atributo (máximo {PONTOS_MAXIMO} pontos no total)
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

          {vm.loadingVantagens ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando vantagens...</span>
            </div>
          ) : (
            <MultiSelect
              label="Selecione Vantagens e Desvantagens"
              options={(vm.vantagensDisponiveis || []).map(v => ({
                value: String(v.id),
                label: `${v.nome} (${v.custo > 0 ? '+' : ''}${v.custo})`
              }))}
              selected={vm.vantagens || []}
              onChange={(selected) => vm.setVantagens(Array.isArray(selected) ? selected : [])}
              max={5}
              placeholder="Buscar vantagens..."
              emptyText="Nenhuma vantagem encontrada."
            />
          )}
          <p className="text-xs text-slate-400 font-modern">
            Selecione até 5 vantagens e desvantagens para personalizar seu personagem
          </p>
        </div>

        {/* Section 4: Equipamentos */}
        <EquipamentoSelector vm={vm} isLight={isLight} />

        {/* Section 5: Background */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ScrollText size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Background
            </h2>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => vm.setBackgroundTipo('guiado')}
              className={`px-4 py-2 rounded-lg font-modern text-sm font-semibold transition-all cursor-pointer ${
                vm.backgroundTipo === 'guiado'
                  ? 'gradient-primary text-white'
                  : isLight
                    ? 'glass-light text-slate-600 hover:bg-slate-100/50'
                    : 'glass text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Gerar com IA
            </button>
            <button
              type="button"
              onClick={() => vm.setBackgroundTipo('personalizado')}
              className={`px-4 py-2 rounded-lg font-modern text-sm font-semibold transition-all cursor-pointer ${
                vm.backgroundTipo === 'personalizado'
                  ? 'gradient-primary text-white'
                  : isLight
                    ? 'glass-light text-slate-600 hover:bg-slate-100/50'
                    : 'glass text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Personalizado
            </button>
          </div>

          {vm.backgroundTipo === 'guiado' ? (
            <div className="space-y-3">
              <Selector
                label="Tema do Background (a IA vai gerar baseado na ficha)"
                options={(vm.backgroundsGuiados || []).map(bg => ({ value: bg, label: bg }))}
                selected={vm.background}
                onChange={(value) => vm.setBackground(value)}
                type="single"
              />
              <p className="text-xs text-slate-400 font-modern">
                A IA vai criar um background usando seus atributos, classe, raça, vantagens e equipamentos
              </p>
            </div>
          ) : (
            <div className="flex flex-col mb-4">
              <label className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Descreva o Background
              </label>
              <textarea
                value={vm.background}
                onChange={e => vm.setBackground(e.target.value)}
                placeholder="Conte a história de origem do seu personagem..."
                rows={4}
                className={`w-full px-4 py-3 rounded-lg font-modern border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none
                  ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'}`}
              />
            </div>
          )}
        </div>

        {/* Section 6: Histórias */}
        <div className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Histórias
            </h2>
          </div>

          {vm.loadingHistorias ? (
            <div className="flex items-center space-x-2 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-slate-400 font-modern text-sm">Carregando histórias...</span>
            </div>
          ) : (vm.historiasDisponiveis || []).length > 0 ? (
            <MultiSelect
              label="Vincular a Histórias (opcional)"
              options={vm.historiasDisponiveis.map(h => ({ value: String(h.id), label: h.nome }))}
              selected={vm.historias || []}
              onChange={(selected) => vm.setHistorias(Array.isArray(selected) ? selected : [])}
              max={3}
              placeholder="Buscar histórias..."
              emptyText="Nenhuma história encontrada."
            />
          ) : (
            <p className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-modern text-sm italic`}>
              Nenhuma história disponível. Crie uma história primeiro.
            </p>
          )}
          <p className="text-xs text-slate-400 font-modern">
            Vincule seu personagem a até 3 histórias existentes
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
            disabled={vm.loading || vm.gerandoBackground}
            className="flex-1"
          >
            {vm.loading || vm.gerandoBackground ? (
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>{vm.gerandoBackground ? 'Gerando background...' : 'Criando...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Criar Personagem</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 card-rpg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`font-semibold font-modern mb-1 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              Dicas para criar seu herói
            </h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Escolha um nome memorável para seu personagem</li>
              <li>• Distribua os atributos de acordo com a classe escolhida</li>
              <li>• Equilibre vantagens e desvantagens para um personagem interessante</li>
              <li>• Um bom background enriquece a experiência de jogo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const EquipamentoSelector = ({ vm, isLight }) => {
  const [busca, setBusca] = useState('');
  const equipamentosDisponiveis = vm.equipamentosDisponiveis || [];
  const selecionados = vm.equipamentos || [];
  const selecionadosSet = new Set(selecionados.map(String));

  const filtrados = equipamentosDisponiveis.filter(eq => {
    if (busca) {
      const termo = busca.toLowerCase();
      return eq.nome?.toLowerCase().includes(termo) || eq.descricao?.toLowerCase().includes(termo);
    }
    return true;
  });

  const toggleEquipamento = (eqId) => {
    const id = String(eqId);
    if (selecionadosSet.has(id)) {
      vm.setEquipamentos(selecionados.filter(s => String(s) !== id));
    } else {
      vm.setEquipamentos([...selecionados, id]);
    }
  };

  const classeNome = (vm.classesDisponiveis || []).find(c => String(c.id) === String(vm.classe))?.nome?.toLowerCase();
  const racaNome = (vm.racasDisponiveis || []).find(r => String(r.id) === String(vm.raca))?.nome?.toLowerCase();

  return (
    <div className="card-rpg space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
            <Swords size={16} className="text-white" />
          </div>
          <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Equipamentos
          </h2>
        </div>
        <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {selecionados.length} selecionado{selecionados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {vm.loadingEquipamentos ? (
        <div className="flex items-center space-x-2 py-4">
          <Loader2 size={16} className="animate-spin text-purple-400" />
          <span className="text-slate-400 font-modern text-sm">Carregando equipamentos...</span>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Buscar equipamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm font-modern border focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
            }`}
          />
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtrados.map(eq => {
              const raridade = eq.raridade_rel?.nome || 'Comum';
              const tipo = Array.isArray(eq.tipo) ? eq.tipo.join(', ') : eq.tipo || '';
              const selected = selecionadosSet.has(String(eq.id));
              const reqClasse = eq.requisitos?.classe;
              const reqRaca = eq.requisitos?.raca;
              const classeOk = !reqClasse || (classeNome && reqClasse.some(c => c.toLowerCase() === classeNome));
              const racaOk = !reqRaca || (racaNome && reqRaca.some(r => r.toLowerCase() === racaNome));
              const compativel = classeOk && racaOk;

              return (
                <div
                  key={eq.id}
                  onClick={() => compativel && toggleEquipamento(eq.id)}
                  className={`p-2 rounded-lg flex items-center justify-between transition-all ${compativel ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                    selected
                      ? isLight ? 'bg-purple-100 border border-purple-300' : 'bg-purple-500/20 border border-purple-500/30'
                      : !compativel
                        ? isLight ? 'bg-slate-50 opacity-50' : 'bg-slate-800/30 opacity-50'
                        : isLight ? 'bg-white border border-slate-200 hover:border-purple-300' : 'bg-slate-800/50 border border-slate-700 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`font-modern text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {eq.nome}
                      </span>
                      <Badge variant={raridadeVariant[raridade] || 'slate'} size="sm">{raridade}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {tipo && <span className={`text-[10px] font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{tipo}</span>}
                      {eq.dano_base && <span className="text-[10px] font-modern text-red-400">Dano: {eq.dano_base}</span>}
                    </div>
                    {!compativel && (
                      <span className="text-[10px] font-modern text-yellow-400">
                        Incompatível com {!classeOk ? 'classe' : 'raça'}
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : isLight ? 'border-slate-300' : 'border-slate-600'
                  }`}>
                    {selected && <Check size={12} />}
                  </div>
                </div>
              );
            })}
            {filtrados.length === 0 && (
              <p className={`text-sm font-modern italic py-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Nenhum equipamento encontrado.
              </p>
            )}
          </div>
        </>
      )}
      <p className="text-xs text-slate-400 font-modern">
        Selecione os equipamentos iniciais do personagem
      </p>
    </div>
  );
};

export default NovoPersonagemView;
