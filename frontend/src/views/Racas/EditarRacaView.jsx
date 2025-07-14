import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import EditarRacaViewModel from '../../viewmodels/Racas/EditarRacaViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';
import FormTextarea from '../../components/form/FormTextarea';

const EditarRacaView = () => {
  const vm = useViewModel(new EditarRacaViewModel());
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.clearError();
    if (id) {
      vm.loadRaca(id);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vm.atualizarRaca(() => navigate('/racas'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldMappings = {
      nome: vm.setNome,
      descricao: vm.setDescricao,
      custo: vm.setCusto
    };
    
    if (name.startsWith('atributo_')) {
      const atributo = name.replace('atributo_', '');
      vm.setAtributoBonus(atributo, value);
    } else if (fieldMappings[name]) {
      fieldMappings[name](value);
    }
  };

  const atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

  if (vm.loadingRaca) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-400 font-modern">Carregando raça...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">🏹</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Raça
        </h1>
        <p className="text-slate-400 font-modern">
          Modifique os detalhes da raça
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

        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputSimples
            label="Nome da raça"
            name="nome"
            value={vm.nome}
            onChange={handleChange}
            placeholder="Ex: Humano, Elfo, Anão"
            required
          />
          <InputSimples
            label="Custo em pontos"
            name="custo"
            type="number"
            value={vm.custo}
            onChange={handleChange}
            placeholder="0"
            min="-10"
            max="10"
            required
          />
        </div>

        {/* Descrição */}
        <FormTextarea
          label="Descrição"
          name="descricao"
          value={vm.descricao}
          onChange={handleChange}
          placeholder="Descreva as características da raça..."
          rows={4}
        />

        {/* Bônus de atributos */}
        <div>
          <label className="block font-semibold mb-4 text-white font-modern">
            🎯 Bônus de Atributos
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {atributos.map((atributo) => (
              <div key={atributo}>
                <label className={`block text-sm capitalize mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  {atributo.charAt(0).toUpperCase() + atributo.slice(1)}
                </label>
                <input
                  type="number"
                  name={`atributo_${atributo}`}
                  value={vm.atributos_bonus[atributo] || 0}
                  onChange={handleChange}
                  className="input-rpg w-full bg-white/10 border border-white/20 backdrop-blur placeholder:text-white/60 text-white px-4 py-2"
                  min="-5"
                  max="5"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Vantagens e desvantagens iniciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-4 text-white font-modern">
              ⭐ Vantagens Iniciais
            </label>
            <FormTextarea
              name="vantagens_iniciais"
              value={vm.vantagens_iniciais.join(', ')}
              onChange={(e) => {
                const vantagens = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                vm.setVantagensIniciais(vantagens);
              }}
              placeholder="Visão Noturna, Imunidade a Veneno..."
              rows={3}
            />
            <p className="text-xs text-slate-400 mt-2 font-modern">
              Separe múltiplas vantagens por vírgula
            </p>
          </div>
          <div>
            <label className="block font-semibold mb-4 text-white font-modern">
              ⚠️ Desvantagens Iniciais
            </label>
            <FormTextarea
              name="desvantagens_iniciais"
              value={vm.desvantagens_iniciais.join(', ')}
              onChange={(e) => {
                const desvantagens = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                vm.setDesvantagensIniciais(desvantagens);
              }}
              placeholder="Medo de Altura, Fraqueza..."
              rows={3}
            />
            <p className="text-xs text-slate-400 mt-2 font-modern">
              Separe múltiplas desvantagens por vírgula
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/racas')}
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
            <span className={`${isLight ? 'text-slate-700' : 'text-white'} text-sm`}>💡</span>
          </div>
          <div>
            <h3 className={`font-semibold font-modern mb-1 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              Dicas para editar raças
            </h3>
            <ul className="text-sm text-slate-400 space-y-1 font-modern">
              <li>• Mantenha a consistência com personagens existentes</li>
              <li>• Considere o impacto das mudanças no jogo</li>
              <li>• Documente as alterações importantes</li>
              <li>• Revise o equilíbrio após as modificações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarRacaView; 