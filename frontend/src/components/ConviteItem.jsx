import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/theme';
import { personagemService } from '../services';
import { useTemaStore } from '../store/tema';

/**
 * 🎮 Componente de Item de Convite
 * 
 * Exibe um convite individual com:
 * - Informações da história
 * - Status do convite
 * - Ações de aceitar/rejeitar
 * - Design responsivo
 */
const ConviteItem = ({ 
  convite, 
  onAccept, 
  onReject, 
  onGoToGame,
  onCreatePersonagem
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // Store de temas para traduzir IDs em nomes
  const getNomesDeTemas = useTemaStore(state => state.getNomesDeTemas);
  const temasCarregados = useTemaStore(state => state.temasCarregados);
  const inicializar = useTemaStore(state => state.inicializar);
  
  // Garantir que os temas estejam carregados
  useEffect(() => {
    if (!temasCarregados) {
      inicializar().catch(error => {
        console.error('❌ ConviteItem: Erro ao inicializar temas:', error);
      });
    }
  }, [temasCarregados, inicializar]);
  
  // Estado para seleção de personagem
  const [personagens, setPersonagens] = useState([]);
  const [selectedPersonagem, setSelectedPersonagem] = useState('');
  const [showPersonagemModal, setShowPersonagemModal] = useState(false);
  const [loadingPersonagens, setLoadingPersonagens] = useState(false);

  // 🎯 FORMATAR DATA
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  // 🎯 OBTER ÍCONE E COR POR STATUS
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pendente':
        return { icon: '⏳', color: 'yellow', text: 'Pendente' };
      case 'aceito':
        return { icon: '✅', color: 'green', text: 'Aceito' };
      case 'rejeitado':
        return { icon: '❌', color: 'red', text: 'Rejeitado' };
      case 'expirado':
        return { icon: '⏰', color: 'gray', text: 'Expirado' };
      default:
        return { icon: '❓', color: 'gray', text: 'Desconhecido' };
    }
  };

  const statusInfo = getStatusInfo(convite.status);

  // 🎯 CARREGAR PERSONAGENS
  const loadPersonagens = async () => {
    try {
      setLoadingPersonagens(true);
      const response = await personagemService.getAll();
      setPersonagens(response || []);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    } finally {
      setLoadingPersonagens(false);
    }
  };

  // 🎯 ABRIR MODAL DE SELEÇÃO DE PERSONAGEM
  const handleAcceptClick = () => {
    if (personagens.length === 0) {
      loadPersonagens();
    }
    setShowPersonagemModal(true);
  };

  // 🎯 CONFIRMAR ACEITAÇÃO DO CONVITE
  const handleConfirmAccept = () => {
    if (!selectedPersonagem) {
      alert('Selecione um personagem para aceitar o convite');
      return;
    }
    
    onAccept(convite, selectedPersonagem);
    setShowPersonagemModal(false);
    setSelectedPersonagem('');
  };

  return (
    <div 
      className={`p-3 mb-2 rounded-lg border transition-all ${
        isLight 
          ? 'bg-slate-50 border-slate-200' 
          : 'bg-slate-700/30 border-slate-600/30'
      }`}
    >
      {/* Header do convite */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="text-lg">🎮</div>
          <div>
            <p className={`font-medium text-sm ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>
              Convite para História
            </p>
            <p className={`text-xs ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              de {convite.remetente.nome}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs ${
            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
            statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusInfo.icon} {statusInfo.text}
          </div>
          
          <span className={`text-xs ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            {formatDate(convite.criado_em)}
          </span>
        </div>
      </div>

      {/* Informações da história */}
      <div className="mb-3">
        <h4 className={`font-bold ${
          isLight ? 'text-slate-800' : 'text-white'
        }`}>
          {convite.historia.nome}
        </h4>
        <p className={`text-sm mt-1 ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {convite.historia.descricao}
        </p>
        
        {/* Temas da história */}
        {convite.historia.temas && convite.historia.temas.length > 0 && (() => {
          // Converter IDs de temas em nomes usando o store
          const temas = Array.isArray(convite.historia.temas) 
            ? convite.historia.temas 
            : [];
          
          // Verificar se são IDs (números) ou nomes (strings)
          // Se todos os valores são números ou strings numéricas, são IDs
          const saoIds = temas.every(t => {
            const num = Number(t);
            return !isNaN(num) && num > 0;
          });
          
          // Converter IDs para nomes se necessário
          const temasNomes = saoIds 
            ? getNomesDeTemas(temas.map(t => Number(t)))
            : temas;
          
          return (
            <div className="flex flex-wrap gap-1 mt-2">
              {temasNomes.filter(Boolean).map((temaNome, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs ${
                    isLight 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-purple-900/50 text-purple-300'
                  }`}
                >
                  {temaNome}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Datas de ação */}
        {convite.aceito_em && (
          <p className={`text-xs mt-2 ${
            isLight ? 'text-green-600' : 'text-green-400'
          }`}>
            ✅ Aceito em {formatDate(convite.aceito_em)}
          </p>
        )}
        {convite.rejeitado_em && (
          <p className={`text-xs mt-2 ${
            isLight ? 'text-red-600' : 'text-red-400'
          }`}>
            ❌ Rejeitado em {formatDate(convite.rejeitado_em)}
          </p>
        )}
        {convite.expirado_em && (
          <p className={`text-xs mt-2 ${
            isLight ? 'text-gray-600' : 'text-gray-400'
          }`}>
            ⏰ Expirado em {formatDate(convite.expirado_em)}
          </p>
        )}
      </div>

      {/* Ações do convite */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {convite.status === 'pendente' && (
            <>
              <button
                onClick={handleAcceptClick}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  isLight 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-green-900/50 text-green-400 hover:bg-green-800/50'
                }`}
              >
                ✅ Aceitar
              </button>
              
              <button
                onClick={() => onReject(convite)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  isLight 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-red-900/50 text-red-400 hover:bg-red-800/50'
                }`}
              >
                ❌ Rejeitar
              </button>
            </>
          )}
          
          {convite.status === 'aceito' && (
            <button
              onClick={() => onGoToGame(convite)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                isLight 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-blue-900/50 text-blue-400 hover:bg-blue-800/50'
              }`}
            >
              🎮 Ir para Jogo
            </button>
          )}
        </div>
      </div>

      {/* Modal de seleção de personagem */}
      {showPersonagemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`p-6 rounded-lg shadow-2xl border max-w-md w-full mx-4 ${
            isLight 
              ? 'bg-white border-slate-200' 
              : 'bg-slate-800 border-slate-600'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>
              Selecionar Personagem
            </h3>
            
            <p className={`text-sm mb-4 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Escolha o personagem que participará da história:
            </p>

            {loadingPersonagens ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                <span className={`ml-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Carregando personagens...
                </span>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {personagens.length === 0 ? (
                    <div className="text-center py-4">
                      <p className={`text-sm ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Você ainda não possui personagens.
                      </p>
                    </div>
                  ) : (
                    personagens.map(personagem => (
                      <label 
                        key={personagem.id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                          selectedPersonagem === personagem.id
                            ? (isLight ? 'bg-purple-100 border-purple-300' : 'bg-purple-900/50 border-purple-500')
                            : (isLight ? 'hover:bg-slate-50 border-slate-200' : 'hover:bg-slate-700/50 border-slate-600')
                        } border`}
                      >
                        <input
                          type="radio"
                          name="personagem"
                          value={personagem.id}
                          checked={selectedPersonagem === personagem.id}
                          onChange={(e) => setSelectedPersonagem(parseInt(e.target.value))}
                          className="mr-3"
                        />
                        <div>
                          <div className={`font-medium ${
                            isLight ? 'text-slate-800' : 'text-white'
                          }`}>
                            {personagem.nome}
                          </div>
                          <div className={`text-xs ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            {personagem.raca?.nome} - {personagem.classe?.nome}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                
                {/* Botão para criar novo personagem */}
                <div className="mb-4 pb-4 border-b border-slate-300/30">
                  <button
                    onClick={() => {
                      setShowPersonagemModal(false);
                      if (onCreatePersonagem) {
                        onCreatePersonagem();
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-md text-sm transition-colors flex items-center justify-center space-x-2 ${
                      isLight 
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                        : 'bg-purple-900/50 text-purple-400 hover:bg-purple-800/50'
                    }`}
                  >
                    <span>➕</span>
                    <span>Criar Novo Personagem</span>
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPersonagemModal(false);
                  setSelectedPersonagem('');
                }}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  isLight 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleConfirmAccept}
                disabled={!selectedPersonagem}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedPersonagem
                    ? (isLight 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-green-900/50 text-green-400 hover:bg-green-800/50')
                    : (isLight 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-600 text-slate-500 cursor-not-allowed')
                }`}
              >
                Aceitar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConviteItem;
