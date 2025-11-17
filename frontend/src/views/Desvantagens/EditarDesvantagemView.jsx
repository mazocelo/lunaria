import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { editarDesvantagemViewModel } from '../../viewmodels/Desvantagens/EditarDesvantagemViewModel.js';
import RPGCard from '../../components/RPGCard.jsx';
import InputSimples from '../../components/form/inputSimples.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import FormSelect from '../../components/form/FormSelect.jsx';
import Button from '../../components/form/button.jsx';

const EditarDesvantagemView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const vm = useViewModel(editarDesvantagemViewModel);

  useEffect(() => {
    if (id) {
      vm.loadDesvantagem(id);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await vm.saveDesvantagem();
    if (result.success) {
      navigate('/desvantagens', { 
        state: { 
          message: 'Desvantagem atualizada com sucesso!',
          type: 'success'
        }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    vm.setField(name, value);
  };

  if (vm.loading) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-slate-400 font-modern">Carregando desvantagem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Desvantagem
        </h1>
        <p className="text-slate-400 font-modern">
          Modifique os detalhes da desvantagem
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

        {/* Nome */}
        <InputSimples
          label="Nome da Desvantagem"
          name="nome"
          value={vm.nome}
          onChange={handleChange}
          placeholder="Digite o nome da desvantagem"
          required
        />

        {/* Descrição */}
        <FormTextarea
          name="descricao"
          label="Descrição"
          value={vm.descricao}
          onChange={handleChange}
          placeholder="Descreva a desvantagem"
          rows={4}
          required
        />

        {/* Custo */}
        <InputSimples
          label="Custo em Pontos"
          name="custo"
          value={vm.custo}
          onChange={handleChange}
          type="number"
          placeholder="0"
          required
        />

        {/* Tipo */}
        <FormSelect
          name="tipo"
          label="Tipo"
          value={vm.tipo}
          onChange={handleChange}
          options={[
            { value: 'Física', label: 'Física' },
            { value: 'Mental', label: 'Mental' },
            { value: 'Social', label: 'Social' },
            { value: 'Mágica', label: 'Mágica' },
            { value: 'Tecnológica', label: 'Tecnológica' }
          ]}
          placeholder="Selecione o tipo"
          required
        />

        {/* Elemento */}
        <FormSelect
          name="elemento"
          label="Elemento"
          value={vm.elemento}
          onChange={handleChange}
          options={[
            { value: 'Fogo', label: 'Fogo' },
            { value: 'Água', label: 'Água' },
            { value: 'Terra', label: 'Terra' },
            { value: 'Ar', label: 'Ar' },
            { value: 'Luz', label: 'Luz' },
            { value: 'Sombra', label: 'Sombra' },
            { value: 'Nenhum', label: 'Nenhum' }
          ]}
          placeholder="Selecione o elemento"
        />

        {/* Nível */}
        <InputSimples
          label="Nível"
          name="nivel"
          value={vm.nivel}
          onChange={handleChange}
          type="number"
          placeholder="1"
          required
        />

        {/* Usar */}
        <InputSimples
          label="Usar (vezes por dia)"
          name="usar"
          value={vm.usar}
          onChange={handleChange}
          type="number"
          placeholder="0"
        />

        {/* Dano Base */}
        <InputSimples
          label="Dano Base"
          name="dano_base"
          value={vm.dano_base}
          onChange={handleChange}
          placeholder="0"
        />

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={() => navigate('/desvantagens')}
            className="btn-rpg-secondary"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={vm.saving}
            className="btn-rpg"
          >
            {vm.saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarDesvantagemView; 