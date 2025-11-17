import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { desvantagemViewModel } from '../../viewmodels/Desvantagens/DesvantagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import RPGCard from '../../components/RPGCard.jsx';
import Button from '../../components/form/button';

const VerDesvantagemView = () => {
  const vm = useViewModel(desvantagemViewModel);
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      vm.loadDesvantagem(id);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      navigate('/desvantagens', {
        state: {
          message: 'Desvantagem excluída com sucesso!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Erro ao excluir desvantagem:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCustoColor = (custo) => {
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  if (vm.loadingVantagemDesvantagem) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
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
          {vm.nome}
        </h1>
        <p className="text-slate-400 font-modern">
          Detalhes da desvantagem
        </p>
      </div>

      <RPGCard className="p-6">
        {/* Informações Básicas */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Nome da Desvantagem
              </label>
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.nome}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Custo em Pontos
              </label>
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                <span className={`font-bold ${getCustoColor(vm.custo)}`}>
                  {vm.custo} pts
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
              Descrição
            </label>
            <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern min-h-24`}>
              {vm.descricao || 'Nenhuma descrição fornecida.'}
            </div>
          </div>
        </div>

        {/* Categorias e Elementos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Categorias e Elementos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Tipos/Categorias
              </label>
              <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.tipo && vm.tipo.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vm.tipo.map((tipo, i) => (
                      <span 
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          isLight 
                            ? 'bg-cyan-100 text-cyan-800' 
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {tipo}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum tipo definido.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Elementos
              </label>
              <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.elemento && vm.elemento.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vm.elemento.map((elemento, i) => (
                      <span 
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          isLight 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {elemento}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum elemento definido.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Configurações Avançadas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Nível
              </label>
              <div className={`p-3 rounded-lg border text-center ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.nivel}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Usar (vezes por dia)
              </label>
              <div className={`p-3 rounded-lg border text-center ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.usar}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Dano Base
              </label>
              <div className={`p-3 rounded-lg border text-center ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.dano_base || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Efeitos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Efeitos
          </h2>
          <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
            {vm.efeito && Object.keys(vm.efeito).length > 0 ? (
              <ul className="list-disc pl-4">
                {Object.entries(vm.efeito).map(([k, v], i) => (
                  <li key={i}><b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                ))}
              </ul>
            ) : (
              <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Nenhum efeito definido.
              </span>
            )}
          </div>
        </div>

        {/* Restrições e Requisitos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Restrições e Requisitos
          </h2>
          <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
            {vm.restricoes ? (
              <p className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {vm.restricoes}
              </p>
            ) : (
              <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Nenhuma restrição definida.
              </span>
            )}
          </div>
        </div>
      </RPGCard>
    </div>
  );
};

export default VerDesvantagemView;