import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';

import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import ClasseViewModel from '../../viewmodels/Classes/ClasseViewModel';

const VerClasseView = () => {
  const vm = useViewModel(new ClasseViewModel());
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      vm.loadClasses(id);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      // Aqui você implementaria a lógica de exclusão
      // Por enquanto, apenas navega de volta
      navigate('/classes', {
        state: {
          message: 'Classe excluída com sucesso!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Erro ao excluir classe:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

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
          {vm.nome}
        </h1>
        <p className="text-slate-400 font-modern">
          Detalhes da classe
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
                Nome da Classe
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
                  {vm.custo > 0 ? `+${vm.custo}` : vm.custo} pts
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

        {/* Bônus de Atributos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            Bônus de Atributos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(vm.atributos_bonus || {}).map(([atributo, bonus]) => (
              <div key={atributo}>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern capitalize`}>
                  {atributo}
                </label>
                <div className={`p-3 rounded-lg border text-center font-modern ${bonus > 0
                    ? isLight
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-green-500/20 border-green-500/30 text-green-300'
                    : bonus < 0
                      ? isLight
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-red-500/20 border-red-500/30 text-red-300'
                      : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-600'
                        : 'bg-slate-700 border-slate-600 text-slate-400'
                  }`}>
                  {bonus > 0 ? `+${bonus}` : bonus}
                </div>
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
              <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.vantagens_iniciais && vm.vantagens_iniciais.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vm.vantagens_iniciais.map((vantagem, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${isLight
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                      >
                        {vantagem}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma vantagem inicial definida.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Desvantagens Iniciais
              </label>
              <div className={`p-3 rounded-lg border min-h-20 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.desvantagens_iniciais && vm.desvantagens_iniciais.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vm.desvantagens_iniciais.map((desvantagem, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${isLight
                            ? 'bg-red-100 text-red-800'
                            : 'bg-red-500/20 text-red-300'
                          }`}
                      >
                        {desvantagem}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma desvantagem inicial definida.
                  </span>
                )}
              </div>
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
            <div className={`p-3 rounded-lg border min-h-32 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
              {vm.habilidades_especiais && vm.habilidades_especiais.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vm.habilidades_especiais.map((habilidade, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded ${isLight
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-purple-500/20 text-purple-300'
                        }`}
                    >
                      {habilidade}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nenhuma habilidade especial definida.
                </span>
              )}
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
                {vm.created_at ? formatDate(vm.created_at) : 'N/A'}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Última atualização
              </label>
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600'} font-modern`}>
                {vm.updated_at ? formatDate(vm.updated_at) : 'N/A'}
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
            onClick={() => navigate('/classes')}
            className="w-full sm:w-auto"
          >
            ← Voltar
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/editar-classe/${vm.id}`)}
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
              Tem certeza que deseja excluir a classe "{vm.nome}"? Esta ação não pode ser desfeita.
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

export default VerClasseView; 