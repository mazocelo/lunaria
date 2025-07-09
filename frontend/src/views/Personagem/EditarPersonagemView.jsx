import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { editarPersonagemViewModel } from '../../viewmodels/Personagens/EditarPersonagemViewModel';

const EditarPersonagemView = () => {
  const vm = useViewModel(editarPersonagemViewModel);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      vm.loadPersonagem(id);
    }
    vm.clearError();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.atualizarPersonagem(() => navigate('/personagens'));
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
      equipamentos: vm.setEquipamentos,
      nivel: vm.setNivel,
      hp: vm.setHP
    };

    // Se for um atributo
    if (name in vm.atributos) {
      vm.setAtributo(name, value);
    } else if (fieldMappings[name]) {
      fieldMappings[name](value);
    }
  };

  if (vm.loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <span className="text-2xl">⚔️</span>
              </div>
              <div className="text-slate-300 font-modern">Carregando personagem...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">✏️</span>
        </div>
        <h1 className="text-3xl font-fantasy font-bold text-white mb-2">
          Editar Personagem
        </h1>
        <p className="text-slate-400 font-modern">
          Modifique os atributos do seu herói
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-rpg space-y-8">
        {/* Mensagem de erro */}
        {vm.error && (
          <div className="mb-6 p-4 glass rounded-lg">
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
            <label className="block font-semibold mb-1 text-white font-modern">Raça</label>
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
            <label className="block font-semibold mb-1 text-white font-modern">Classe</label>
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
            <label className="block font-semibold mb-1 text-white font-modern">Profissão</label>
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
          <label className="block font-semibold mb-1 text-white font-modern">Background</label>
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
          <label className="block font-semibold mb-1 text-white font-modern">Atributos</label>
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

        {/* Nível e HP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1 text-white font-modern">Nível</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={20}
                name="nivel"
                value={vm.nivel}
                onChange={handleChange}
                className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
                placeholder="Nível atual"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <span className="text-sm">⭐</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-white font-modern">Pontos de Vida</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={999}
                name="hp"
                value={vm.hp}
                onChange={handleChange}
                className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
                placeholder="HP atual"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <span className="text-sm">❤️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Habilidades especiais */}
        <div>
          <label className="block font-semibold mb-1 text-white font-modern">Habilidades especiais</label>
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
          <label className="block font-semibold mb-1 text-white font-modern">Equipamentos</label>
          <textarea
            name="equipamentos"
            value={vm.equipamentos}
            onChange={handleChange}
            className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
            placeholder="Liste os equipamentos"
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
            disabled={vm.loading}
            className="flex-1"
          >
            {vm.loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>💾</span>
                <span>Salvar Alterações</span>
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
            <h3 className="font-semibold text-white font-modern mb-1">Dicas para edição</h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Mantenha a consistência com a história do personagem</li>
              <li>• Considere o impacto das mudanças no jogo</li>
              <li>• Documente as alterações importantes</li>
              <li>• Revise as estatísticas após as modificações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPersonagemView; 