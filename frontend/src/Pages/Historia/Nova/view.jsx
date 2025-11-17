import React, { useEffect } from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import Selector from '../../../components/form/Selector';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { novaHistoriaViewModel } from './viewmodel';
import { useTheme } from '../../../contexts/theme.jsx';

const NovaHistoriaView = () => {
  const vm = useViewModel(novaHistoriaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadTemas();
    vm.clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.criarHistoria(() => navigate('/historias'));
  };

  // Handler para o Selector
  const handleTemasChange = (selected) => {
    vm.setTemasSelecionados(selected);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">📚</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Nova História
        </h1>
        <p className="text-slate-400 font-modern">
          Dê vida a uma nova aventura épica
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {/* Mensagem de erro */}
        {vm.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-700' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p>
              </div>
            </div>
          </div>
        )}

        <InputSimples
          label="Nome da História"
          name="nome"
          onChange={e => vm.setNome(e.target.value)}
          value={vm.nome}
          placeholder="Digite o nome da sua aventura..."
        />

        <Selector
          label="Escolha os Temas"
          options={vm.temas?.map((tema) => ({ value: tema.id, label: tema.nome })) || []}
          selected={vm.temasSelecionados}
          onChange={handleTemasChange}
          type="multiple"
          max={3}
          containerClass="mb-2"
        />
        <p className="text-xs text-slate-400 mt-2 font-modern">
          Selecione até 3 temas para categorizar sua história
        </p>

        <InputSimples
          label="Máximo de Participantes"
          type="number"
          min={2}
          max={10}
          value={vm.maximo_de_participantes}
          onChange={e => vm.setMaximoDeParticipantes(Number(e.target.value))}
          placeholder="Número de jogadores"
          required
        />
        <p className="text-xs text-slate-400 mt-2 font-modern">
          Recomendamos entre 2 e 10 jogadores para uma experiência ideal
        </p>

        {/* Botões de ação */}
        <div className="flex space-x-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/historias')}
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
                <span>Criar História</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Dicas */}
      <div className="mt-6 card-rpg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <span className={`${isLight ? 'text-slate-700' : 'text-white'} text-sm`}>💡</span>
          </div>
          <div>
            <h3 className={`font-semibold font-modern mb-1 ${isLight ? 'text-slate-700' : 'text-white'}`}>Dicas para uma boa história</h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Escolha um nome memorável e descritivo</li>
              <li>• Selecione temas que combinem com sua narrativa</li>
              <li>• Considere o número ideal de jogadores para sua história</li>
              <li>• Pense na progressão e desenvolvimento dos personagens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovaHistoriaView;

