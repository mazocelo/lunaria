import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { vantagemViewModel } from '../../viewmodels/Vantagens/VantagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import RPGCard from '../../components/RPGCard.jsx';
import Button from '../../components/form/button';

const VerVantagemView = () => {
  const vm = useViewModel(vantagemViewModel);
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      vm.loadVantagemDesvantagem(id);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      // Aqui você implementaria a lógica de exclusão
      // Por enquanto, apenas navega de volta
      navigate('/vantagens', { 
        state: { 
          message: 'Vantagem excluída com sucesso!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Erro ao excluir vantagem:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    return 'text-slate-400';
  };

  if (vm.loadingVantagemDesvantagem) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-slate-400 font-modern">Carregando vantagem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⭐</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          {vm.nome}
        </h1>
        <p className="text-slate-400 font-modern">
          Detalhes da vantagem
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
                Nome da Vantagem
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
                  +{vm.custo} pts
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
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.dano_base || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Bônus e Restrições */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Bônus e Restrições
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Bônus
              </label>
              <div className={`p-3 rounded-lg border min-h-32 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {Object.keys(vm.bonus || {}).length > 0 ? (
                  <pre className={`text-sm ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {JSON.stringify(vm.bonus, null, 2)}
                  </pre>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum bônus definido.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Restrições
              </label>
              <div className={`p-3 rounded-lg border min-h-32 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {Object.keys(vm.restricao || {}).length > 0 ? (
                  <pre className={`text-sm ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {JSON.stringify(vm.restricao, null, 2)}
                  </pre>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma restrição definida.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Efeitos e Requisitos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Efeitos e Requisitos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Efeitos
              </label>
              <div className={`p-3 rounded-lg border min-h-32 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {Object.keys(vm.efeito || {}).length > 0 ? (
                  <pre className={`text-sm ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {JSON.stringify(vm.efeito, null, 2)}
                  </pre>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum efeito definido.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Requisitos
              </label>
              <div className={`p-3 rounded-lg border min-h-32 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {Object.keys(vm.requisitos || {}).length > 0 ? (
                  <pre className={`text-sm ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {JSON.stringify(vm.requisitos, null, 2)}
                  </pre>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhum requisito definido.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Sistema */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Informações de Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Criado em
              </label>
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.criada_em ? formatDate(vm.criada_em) : 'N/A'}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Última atualização
              </label>
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.atualizada_em ? formatDate(vm.atualizada_em) : 'N/A'}
              </div>
            </div>
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
            variant="ghost"
            onClick={() => navigate('/vantagens')}
            className="w-full sm:w-auto"
          >
            ← Voltar
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/editar-vantagem/${vm.id}`)}
            className="w-full sm:w-auto text-yellow-400 hover:text-yellow-300"
          >
            ✏️ Editar
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDeleteConfirm(true)}
            className="w-full sm:w-auto text-red-400 hover:text-red-300"
          >
            🗑️ Excluir
          </Button>
        </div>
      </RPGCard>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Confirmar exclusão
            </h3>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern mb-6`}>
              Tem certeza que deseja excluir a vantagem "{vm.nome}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerVantagemView; 