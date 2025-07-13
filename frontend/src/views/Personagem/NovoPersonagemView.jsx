import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import FormSelect from '../../components/form/FormSelect';
import FormTextarea from '../../components/form/FormTextarea';
import FormRadioGroup from '../../components/form/FormRadioGroup';
import FormHabilidade from '../../components/form/FormHabilidade';
import FormSelectDescricao from '../../components/form/FormSelectDescricao';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { novoPersonagemViewModel } from '../../viewmodels/Personagens/NovoPersonagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';

// Opções de exemplo para Classe, Raça e Profissão
const opcoesClasse = [
  { value: 'guerreiro', label: 'Guerreiro', descricao: 'Especialista em combate corpo a corpo, forte e resistente.' },
  { value: 'mago', label: 'Mago', descricao: 'Usuário de magia arcana, domina feitiços poderosos.' },
  { value: 'arqueiro', label: 'Arqueiro', descricao: 'Especialista em ataques à distância e furtividade.' },
  { value: 'ladino', label: 'Ladino', descricao: 'Ágil, mestre em furtividade e armadilhas.' }
];
const opcoesRaca = [
  { value: 'humano', label: 'Humano', descricao: 'Versátil e adaptável, aprende rápido.' },
  { value: 'elfo', label: 'Elfo', descricao: 'Ágil, com sentidos aguçados e afinidade com magia.' },
  { value: 'anao', label: 'Anão', descricao: 'Resistente, mestre em forja e combate pesado.' },
  { value: 'orc', label: 'Orc', descricao: 'Forte, feroz e com grande vigor físico.' }
];
const opcoesProfissao = [
  { value: 'ferreiro', label: 'Ferreiro', descricao: 'Especialista em criar e reparar armas e armaduras.' },
  { value: 'alquimista', label: 'Alquimista', descricao: 'Mestre em poções, elixires e explosivos.' },
  { value: 'curandeiro', label: 'Curandeiro', descricao: 'Especialista em cura e suporte ao grupo.' },
  { value: 'mercador', label: 'Mercador', descricao: 'Hábil em negociações e comércio.' }
];

const NovoPersonagemView = () => {
  const vm = useViewModel(novoPersonagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.clearError();
    vm.resetPontos();
    vm.loadHabilidades({ nivel: 1 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.criarPersonagem(() => navigate('/personagens'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldMappings = {
      nome: vm.setNome,
      raca: vm.setRaca,
      classe: vm.setClasse,
      profissao: vm.setProfissao,
      backgroundTipo: vm.setBackgroundTipo,
      background: vm.setBackground,
      habilidades: vm.setHabilidades,
      equipamentos: vm.setEquipamentos
    };
    if (name in vm.atributos) {
      vm.setAtributo(name, value);
    } else if (fieldMappings[name]) {
      fieldMappings[name](value);
    }
  };

  // Handler especial para habilidades múltiplas
  const handleHabilidadesChange = (e) => {
    // value é um array de IDs
    vm.setHabilidades(e.target.value);
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

        {/* Pontos de atributos */}
        <div className="mb-6 p-4 glass rounded-lg">
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Pontos para distribuir:
            </span>
            <span className={`font-bold text-lg ${vm.pontosRestantes < 0 ? "text-red-400" : "text-cyan-400"}`}>
              {vm.pontosRestantes} / {vm.pontosTotais}
            </span>
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

        {/* Raça / Classe / Profissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormSelectDescricao
            label="Raça"
            name="raca"
            value={vm.raca}
            onChange={handleChange}
            options={opcoesRaca}
            placeholder="Selecione a raça"
            required
          />
          <FormSelectDescricao
            label="Classe"
            name="classe"
            value={vm.classe}
            onChange={handleChange}
            options={opcoesClasse}
            placeholder="Selecione a classe"
            required
          />
          <FormSelectDescricao
            label="Profissão"
            name="profissao"
            value={vm.profissao}
            onChange={handleChange}
            options={opcoesProfissao}
            placeholder="Selecione a profissão"
            required
          />
        </div>

        {/* Atributos */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Atributos</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.keys(vm.atributos).map((attr) => (
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

        {/* Habilidades */}
        <FormHabilidade
          name="habilidades"
          label="Habilidades"
          value={vm.habilidades}
          onChange={handleHabilidadesChange}
          options={vm.habilidadesDisponiveis?.map(habilidade => ({
            value: habilidade.id,
            label: habilidade.nome,
            custo: habilidade.custo,
            descricao: habilidade.descricao
          })) || []}
          placeholder={vm.loadingHabilidades ? "Carregando habilidades..." : "Selecione as habilidades"}
          required
          disabled={vm.loadingHabilidades}
          pontosRestantes={vm.pontosRestantes}
          habilidadeError={vm.habilidadeError}
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