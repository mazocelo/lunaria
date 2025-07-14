import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import EditarClasseViewModel from '../../viewmodels/Classes/EditarClasseViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';
import FormSelectDescricao from '../../components/form/FormSelectDescricao';

const EditarClasseView = () => {
  const vm = useViewModel(new EditarClasseViewModel());
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (id) {
      vm.loadClasse(id);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await vm.atualizarClasse((response) => {
      navigate('/classes', { 
        state: { 
          message: 'Classe atualizada com sucesso!',
          type: 'success'
        }
      });
    });
  };

  const handleCancel = () => {
    navigate('/classes');
  };

  const atributos = [
    { value: 'forca', label: 'Força', descricao: 'Força física e poder de combate' },
    { value: 'destreza', label: 'Destreza', descricao: 'Agilidade e precisão' },
    { value: 'constituicao', label: 'Constituição', descricao: 'Resistência e saúde' },
    { value: 'inteligencia', label: 'Inteligência', descricao: 'Conhecimento e lógica' },
    { value: 'agilidade', label: 'Agilidade', descricao: 'Velocidade e reflexos' },
    { value: 'carisma', label: 'Carisma', descricao: 'Personalidade e influência' }
  ];

  if (vm.loadingClasse) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-slate-400 font-modern">Carregando classe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Classe
        </h1>
        <p className="text-slate-400 font-modern">
          Modifique as características e habilidades da classe
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <RPGCard className="p-6">
          {/* Informações Básicas */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Nome da Classe *
                </label>
                <InputSimples
                  value={vm.nome}
                  onChange={(e) => vm.setNome(e.target.value)}
                  placeholder="Ex: Guerreiro, Mago, Arqueiro..."
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Custo em Pontos
                </label>
                <InputSimples
                  type="number"
                  value={vm.custo}
                  onChange={(e) => vm.setCusto(e.target.value)}
                  placeholder="0"
                  min="-10"
                  max="10"
                  className="w-full"
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  Custo negativo = pontos extras, positivo = custa pontos
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Descrição
              </label>
              <textarea
                value={vm.descricao}
                onChange={(e) => vm.setDescricao(e.target.value)}
                placeholder="Descreva as características e especialidades desta classe..."
                className={`w-full p-3 rounded-lg border resize-none h-24 font-modern ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                    : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                maxLength={1000}
              />
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                {vm.descricao.length}/1000 caracteres
              </p>
            </div>
          </div>

          {/* Bônus de Atributos */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Bônus de Atributos
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {atributos.map((atributo) => (
                <div key={atributo.value}>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                    {atributo.label}
                  </label>
                  <InputSimples
                    type="number"
                    value={vm.atributos_bonus[atributo.value] || 0}
                    onChange={(e) => vm.setAtributoBonus(atributo.value, e.target.value)}
                    placeholder="0"
                    min="-5"
                    max="5"
                    className="w-full"
                  />
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                    {atributo.descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vantagens e Desvantagens Iniciais */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Vantagens e Desvantagens Iniciais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Vantagens Iniciais
                </label>
                <FormSelectDescricao
                  value={vm.vantagens_iniciais}
                  onChange={vm.setVantagensIniciais}
                  placeholder="Selecione as vantagens..."
                  isMulti
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Desvantagens Iniciais
                </label>
                <FormSelectDescricao
                  value={vm.desvantagens_iniciais}
                  onChange={vm.setDesvantagensIniciais}
                  placeholder="Selecione as desvantagens..."
                  isMulti
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Habilidades Especiais */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Habilidades Especiais
            </h2>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Habilidades Únicas da Classe
              </label>
              <textarea
                value={vm.habilidades_especiais.join('\n')}
                onChange={(e) => vm.setHabilidadesEspeciais(e.target.value.split('\n').filter(h => h.trim()))}
                placeholder="Digite uma habilidade por linha...&#10;Ex:&#10;Ataque Extra&#10;Defesa Aprimorada&#10;Conjurar Feitiços"
                className={`w-full p-3 rounded-lg border resize-none h-32 font-modern ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                    : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                Digite uma habilidade por linha
              </p>
            </div>
          </div>

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

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={vm.loading}
              className="w-full sm:w-auto"
            >
              {vm.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Atualizando...
                </>
              ) : (
                '✨ Atualizar Classe'
              )}
            </Button>
          </div>
        </RPGCard>
      </form>
    </div>
  );
};

export default EditarClasseView; 