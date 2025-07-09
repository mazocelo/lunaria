import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { novoPersonagemViewModel } from '../../viewmodels/Personagens/NovoPersonagemViewModel';

const NovoPersonagemView = () => {
  const vm = useViewModel(novoPersonagemViewModel);
  const navigate = useNavigate();

  useEffect(() => {
    vm.clearError();
    vm.resetPontos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.criarPersonagem(() => navigate('/personagens'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mapear campos para métodos do ViewModel
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

    // Se for um atributo
    if (name in vm.atributos) {
      vm.setAtributo(name, value);
    } else if (fieldMappings[name]) {
      fieldMappings[name](value);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className="text-3xl font-fantasy font-bold text-white mb-2">
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
                <span className="text-white text-sm">!</span>
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
            <span className="font-semibold text-white font-modern">
              Pontos para distribuir:
            </span>
            <span className={`font-bold text-lg ${vm.pontosRestantes < 0 ? "text-red-400" : "text-cyan-400"}`}>
              {vm.pontosRestantes} / {vm.pontosTotais}
            </span>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Nome do personagem</label>
          <input
            type="text"
            name="nome"
            value={vm.nome}
            onChange={handleChange}
            className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
            placeholder="Digite o nome"
          />
        </div>

        {/* Raça / Classe / Profissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block font-semibold mb-2 text-white font-modern">Raça</label>
            <input
              type="text"
              name="raca"
              value={vm.raca}
              onChange={handleChange}
              className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
              placeholder="Raça"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-white font-modern">Classe</label>
            <input
              type="text"
              name="classe"
              value={vm.classe}
              onChange={handleChange}
              className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
              placeholder="Classe"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-white font-modern">Profissão</label>
            <input
              type="text"
              name="profissao"
              value={vm.profissao}
              onChange={handleChange}
              className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
              placeholder="Profissão"
            />
          </div>
        </div>

        {/* Background */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Background</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1 text-white font-modern">
              <input
                type="radio"
                name="backgroundTipo"
                value="guiado"
                checked={vm.backgroundTipo === "guiado"}
                onChange={handleChange}
                className="mr-2"
              />
              Guiado
            </label>
            <label className="flex items-center gap-1 text-white font-modern">
              <input
                type="radio"
                name="backgroundTipo"
                value="livre"
                checked={vm.backgroundTipo === "livre"}
                onChange={handleChange}
                className="mr-2"
              />
              Livre
            </label>
          </div>
          {vm.backgroundTipo === "guiado" ? (
            <select
              name="background"
              value={vm.background}
              onChange={handleChange}
              className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
            >
              <option value="">Selecione um background</option>
              {vm.backgroundsGuiados.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              name="background"
              value={vm.background}
              onChange={handleChange}
              className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
              placeholder="Descreva o background livremente"
              rows={3}
            />
          )}
        </div>

        {/* Atributos */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Atributos</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.keys(vm.atributos).map((attr) => (
              <div key={attr}>
                <label className="block text-sm capitalize text-white font-modern">{attr}</label>
                <input
                  type="number"
                  name={attr}
                  value={vm.atributos[attr]}
                  onChange={handleChange}
                  className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
                  min={0}
                  max={20}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Habilidades especiais */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Habilidades especiais</label>
          <textarea
            name="habilidades"
            value={vm.habilidades}
            onChange={handleChange}
            className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
            placeholder="Liste ou descreva as habilidades especiais"
            rows={2}
          />
        </div>

        {/* Equipamentos iniciais */}
        <div>
          <label className="block font-semibold mb-2 text-white font-modern">Equipamentos iniciais</label>
          <textarea
            name="equipamentos"
            value={vm.equipamentos}
            onChange={handleChange}
            className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
            placeholder="Liste os equipamentos iniciais"
            rows={2}
          />
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
            disabled={vm.pontosRestantes !== 0 || vm.loading}
            className="flex-1"
            title={vm.pontosRestantes !== 0 ? "Distribua todos os pontos antes de salvar" : ""}
          >
            {vm.loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Criando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>⚔️</span>
                <span>Criar Personagem</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Dicas */}
      <div className="mt-6 card-rpg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-white font-modern mb-1">Dicas para um bom personagem</h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Distribua todos os pontos de atributos antes de salvar</li>
              <li>• Combine classe e raça para criar sinergias</li>
              <li>• Considere a história de fundo do personagem</li>
              <li>• Pense na progressão e desenvolvimento futuro</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoPersonagemView; 