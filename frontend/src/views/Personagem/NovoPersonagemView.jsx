import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import FormSelect from '../../components/form/FormSelect';
import FormTextarea from '../../components/form/FormTextarea';
import FormRadioGroup from '../../components/form/FormRadioGroup';
import FormVantagem from '../../components/form/FormVantagem';
import FormSelectDescricao from '../../components/form/FormSelectDescricao';
import FormHistorias from '../../components/form/FormHistorias';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { novoPersonagemViewModel } from '../../viewmodels/Personagens/NovoPersonagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';

// Opções de exemplo para Classe, Raça e Profissão (fallback caso API não esteja disponível)
const opcoesClasse = [
  { value: 'guerreiro', label: 'Guerreiro', descricao: 'Especialista em combate corpo a corpo, forte e resistente.', custo: 0 },
  { value: 'mago', label: 'Mago', descricao: 'Usuário de magia arcana, domina feitiços poderosos.', custo: 2 },
  { value: 'arqueiro', label: 'Arqueiro', descricao: 'Especialista em ataques à distância e furtividade.', custo: 1 },
  { value: 'ladino', label: 'Ladino', descricao: 'Ágil, mestre em furtividade e armadilhas.', custo: 1 }
];
const opcoesRaca = [
  { value: 'humano', label: 'Humano', descricao: 'Versátil e adaptável, aprende rápido.', custo: 0 },
  { value: 'elfo', label: 'Elfo', descricao: 'Ágil, com sentidos aguçados e afinidade com magia.', custo: 2 },
  { value: 'anao', label: 'Anão', descricao: 'Resistente, mestre em forja e combate pesado.', custo: 1 },
  { value: 'orc', label: 'Orc', descricao: 'Forte, feroz e com grande vigor físico.', custo: 3 }
];


const NovoPersonagemView = () => {
  const vm = useViewModel(novoPersonagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.clearError();
    vm.resetPontos();
    vm.loadVantagens({ nivel: 1 });
    vm.loadDesvantagens({ nivel: 1 });
    vm.loadHistorias();
    vm.loadOpcoes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.criarPersonagem(() => navigate('/personagens'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldMappings = {
      nome: vm.setNome,
      historias: vm.setHistorias,
      raca: vm.setRaca,
      classe: vm.setClasse,
      backgroundTipo: vm.setBackgroundTipo,
      background: vm.setBackground,
      vantagens: vm.setVantagens,
      desvantagens: vm.setDesvantagens,
      equipamentos: vm.setEquipamentos
    };
    if (vm.atributos && name in vm.atributos) {
      vm.setAtributo(name, value);
    } else if (fieldMappings[name]) {
      fieldMappings[name](value);
    }
  };

  // Handler especial para vantagens múltiplas
  const handleVantagensChange = (e) => {
    vm.setVantagens(e.target.value);
  };

  // Handler especial para desvantagens múltiplas
  const handleDesvantagensChange = (e) => {
    vm.setDesvantagens(e.target.value);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Novo Personagem
        </h1>
        <p className="text-slate-400 font-modern">
          Dê vida a um novo herói épico
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-rpg space-y-8">
        {/* Mensagem de erro */}
        {vm.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pontos utilizados */}
        <div className="mb-6 p-4 glass rounded-lg">
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Pontos utilizados:
            </span>
            <span className={`font-bold text-lg text-cyan-400`}>
              {vm.pontosUsados}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-400 font-modern">
            <span>Atributos: {vm.pontosDistribuidos} | Vantagens: {vm.pontosVantagens} | Desvantagens: {vm.pontosDesvantagens} | Raça: {vm.custoRaca} | Classe: {vm.custoClasse}</span>
          </div>
        </div>

        {/* Nome */}
        <InputSimples
          label="Nome do personagem"
          name="nome"
          value={vm.nome}
          onChange={handleChange}
          placeholder="Digite o nome"
          required
        />

        {/* Raça / Classe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormSelectDescricao
            label="Raça"
            name="raca"
            value={String(vm.raca_id || '')}
            onChange={handleChange}
            options={vm.racasDisponiveis?.length > 0 ? vm.racasDisponiveis.map(raca => {
              if (!raca || typeof raca !== 'object') {
                return null;
              }
              return {
                value: String(raca.id || raca.value || ''),
                label: raca.nome || raca.label || '',
                descricao: raca.descricao || '',
                custo: raca.custo || 0
              };
            }).filter(Boolean) : opcoesRaca}
            placeholder={vm.loadingOpcoes ? "Carregando raças..." : "Selecione a raça"}
            required
            disabled={vm.loadingOpcoes}
          />
          <FormSelectDescricao
            label="Classe"
            name="classe"
            value={String(vm.classe_id || '')}
            onChange={handleChange}
            options={vm.classesDisponiveis?.length > 0 ? vm.classesDisponiveis.map(classe => {
              if (!classe || typeof classe !== 'object') {
                return null;
              }
              return {
                value: String(classe.id || classe.value || ''),
                label: classe.nome || classe.label || '',
                descricao: classe.descricao || '',
                custo: classe.custo || 0
              };
            }).filter(Boolean) : opcoesClasse}
            placeholder={vm.loadingOpcoes ? "Carregando classes..." : "Selecione a classe"}
            required
            disabled={vm.loadingOpcoes}
          />
        </div>

        {/* Atributos */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Atributos</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.keys(vm.atributos || {}).map((attr) => (
              <InputSimples
                key={attr}
                label={attr.charAt(0).toUpperCase() + attr.slice(1)}
                name={attr}
                value={vm.atributos[attr]}
                onChange={handleChange}
                type="number"
                required
              />
            ))}
          </div>
        </div>

        {/* Vantagens */}
        <FormVantagem
          name="vantagens"
          label="Vantagens"
          value={vm.vantagens}
          onChange={handleVantagensChange}
          options={vm.vantagensDisponiveis?.map(vantagem => {
            if (!vantagem || typeof vantagem !== 'object') {
              return null;
            }
            return {
              value: String(vantagem.id || vantagem.value || ''),
              label: vantagem.nome || vantagem.label || '',
              custo: vantagem.custo || 0,
              descricao: vantagem.descricao || '',
              tipo: vantagem.tipo || 'vantagem'
            };
          }).filter(Boolean) || []}
          placeholder={vm.loadingVantagens ? "Carregando vantagens..." : "Selecione as vantagens"}
          disabled={vm.loadingVantagens}
          pontosRestantes={vm.pontosUsados}
          vantagemError={vm.vantagemError}
        />

        {/* Desvantagens */}
        <FormVantagem
          name="desvantagens"
          label="Desvantagens"
          value={vm.desvantagens}
          onChange={handleDesvantagensChange}
          options={vm.desvantagensDisponiveis?.map(desvantagem => {
            if (!desvantagem || typeof desvantagem !== 'object') {
              return null;
            }
            return {
              value: String(desvantagem.id || desvantagem.value || ''),
              label: desvantagem.nome || desvantagem.label || '',
              custo: desvantagem.custo || 0,
              descricao: desvantagem.descricao || '',
              tipo: desvantagem.tipo || 'desvantagem'
            };
          }).filter(Boolean) || []}
          placeholder={vm.loadingDesvantagens ? "Carregando desvantagens..." : "Selecione as desvantagens"}
          disabled={vm.loadingDesvantagens}
          pontosRestantes={vm.pontosUsados}
          vantagemError={vm.vantagemError}
        />

        {/* Equipamentos */}
        <InputSimples
          label="Equipamentos"
          name="equipamentos"
          value={vm.equipamentos}
          onChange={handleChange}
          placeholder="Liste os equipamentos"
        />

        {/* Background */}
        <div>
          <FormRadioGroup
            label="Background"
            name="backgroundTipo"
            value={vm.backgroundTipo}
            onChange={handleChange}
            options={[
              { value: 'guiado', label: 'Guiado' },
              { value: 'livre', label: 'Livre' }
            ]}
          />
          {vm.backgroundTipo === "guiado" ? (
            <FormSelect
              name="background"
              label="Selecione um background"
              value={vm.background}
              onChange={handleChange}
              options={vm.backgroundsGuiados.map(bg => ({ value: bg, label: bg }))}
              placeholder="Selecione um background"
              required
            />
          ) : (
            <FormTextarea
              name="background"
              label="Descreva o background livremente"
              value={vm.background}
              onChange={handleChange}
              placeholder="Descreva o background livremente"
              rows={3}
              required
            />
          )}
        </div>

        {/* Histórias */}
        <FormHistorias
          label="Histórias (Opcional)"
          name="historias"
          value={vm.historias}
          onChange={handleChange}
          options={Array.isArray(vm.historiasDisponiveis) ? vm.historiasDisponiveis.map(historia => ({
            value: String(historia.id),
            label: historia.nome
          })) : []}
          placeholder={vm.loadingHistorias ? "Carregando histórias..." : "Selecione as histórias (opcional)"}
          disabled={vm.loadingHistorias}
        />

        {/* Botões de ação */}
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
            disabled={vm.loading}
            className="flex-1"
          >
            {vm.loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Criando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>Criar Personagem</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoPersonagemView; 