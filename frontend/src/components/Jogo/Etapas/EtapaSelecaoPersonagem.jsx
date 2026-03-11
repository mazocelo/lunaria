import React, { useEffect } from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import LoadingSpinner from '../../LoadingSpinner.jsx';
import { useTemaStore } from '../../../store/index.js';

/**
 * Componente para a etapa de selecao de personagem
 * Usado por: JogoView (etapa 'selecao-personagem')
 * Refatorado: Usa hooks diretos (useTemaStore) no lugar de ViewModel
 */
const EtapaSelecaoPersonagem = ({
  historia,
  personagens,
  personagemSelecionado,
  loading,
  error,
  onSelecionarPersonagem,
  onVoltar
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Store de temas - acesso direto via hook
  const temasCarregados = useTemaStore(s => s.temasCarregados);
  const temasLoading = useTemaStore(s => s.loading);
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const getNomesDeTemas = useTemaStore(s => s.getNomesDeTemas);

  // Carregar temas se necessario
  useEffect(() => {
    if (!temasCarregados) {
      carregarTemas();
    }
  }, [temasCarregados, carregarTemas]);

  // Helpers inline (antes no ViewModel)
  const obterTemasNomes = (hist) => {
    if (!hist?.temas || !Array.isArray(hist.temas)) return [];
    return getNomesDeTemas(hist.temas);
  };

  const formatarInformacoesHistoria = (hist) => {
    if (!hist) return { nome: 'Historia sem nome', descricao: '', maximoParticipantes: 0 };
    return {
      nome: hist.nome || hist.titulo || 'Historia sem nome',
      descricao: hist.descricao || '',
      maximoParticipantes: hist.maximo_de_participantes || 0,
    };
  };

  const formatarInformacoesPersonagem = (p) => {
    if (!p) return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', hpMaximo: '???' };
    return {
      nome: p.nome || 'Personagem sem nome',
      classe: p.classe_nome || p.classe || 'Desconhecida',
      raca: p.raca_nome || p.raca || 'Desconhecida',
      nivel: p.nivel || '1',
      hp: p.hp_atual || p.hp || '???',
      hpMaximo: p.hp_maximo || p.hp || '???',
    };
  };

  const temPersonagensDisponiveis = (list) => Array.isArray(list) && list.length > 0;
  const isPersonagemSelecionadoFn = (p, sel) => p && sel && p.id === sel.id;

  const temasNomes = obterTemasNomes(historia);
  const infoHistoria = formatarInformacoesHistoria(historia);

  return (
    <div className="space-y-6">
      {/* Informacoes da Historia */}
      <div className="card-rpg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-4`}>
              {infoHistoria.nome}
            </h2>

            {/* Temas por nome */}
            <div className="flex flex-wrap gap-2 mb-6">
              {temasLoading ? (
                <span className="text-slate-500 text-sm animate-pulse">Carregando temas...</span>
              ) : temasNomes.length > 0 ? (
                temasNomes.map((temaNome, i) => (
                  <span key={i} className="px-4 py-2 text-sm rounded-full bg-purple-600/20 text-purple-300 font-modern border border-purple-500/30">
                    {temaNome}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">Sem temas definidos</span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <span className={`flex items-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className="mr-1">👥</span>
                Max. {infoHistoria.maximoParticipantes} participantes
              </span>

              {infoHistoria.descricao && (
                <span className={`flex items-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="mr-1">📖</span>
                  {infoHistoria.descricao.length > 50
                    ? `${infoHistoria.descricao.substring(0, 50)}...`
                    : infoHistoria.descricao
                  }
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onVoltar}
            className="btn-rpg-secondary flex items-center space-x-2 cursor-pointer px-4 py-2"
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
        </div>
      </div>

      {/* Selecao de Personagem */}
      <div className="card-rpg p-6">
        <h3 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-6`}>
          👤 Escolha seu Personagem
        </h3>

        {loading && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Carregando personagens..." />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className={`text-xl ${isLight ? 'text-red-600' : 'text-red-400'} mb-4 font-modern`}>
              {error}
            </p>
          </div>
        )}

        {!loading && temPersonagensDisponiveis(personagens) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personagens.map((personagem) => (
              <PersonagemCard
                key={personagem.id}
                personagem={personagem}
                isSelected={isPersonagemSelecionadoFn(personagem, personagemSelecionado)}
                onSelect={() => onSelecionarPersonagem(personagem)}
                isLight={isLight}
                formatarInfo={formatarInformacoesPersonagem}
              />
            ))}
          </div>
        )}

        {!loading && !temPersonagensDisponiveis(personagens) && !error && (
          <div className="text-center py-8">
            <p className={`text-xl ${isLight ? 'text-slate-600' : 'text-slate-400'} mb-4 font-modern`}>
              Nenhum personagem encontrado para esta historia
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Voce precisa criar um personagem para esta historia primeiro
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/novo-personagem'}
                className="btn-rpg px-6 py-2 text-sm"
              >
                ➕ Criar Personagem
              </button>
            </div>
          </div>
        )}

        {personagemSelecionado && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  {personagemSelecionado.nome} selecionado!
                </p>
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  🏠 Abrindo sala de espera automaticamente...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Card individual de personagem
 */
const PersonagemCard = ({ personagem, isSelected, onSelect, isLight, formatarInfo }) => {
  const infoPersonagem = formatarInfo(personagem);

  return (
    <div
      onClick={onSelect}
      className={`
        card-rpg cursor-pointer transition-all duration-300 hover:scale-105 p-4 border-2
        ${isSelected
          ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
          : 'border-transparent hover:border-purple-500/50'
        }
      `}
    >
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          {personagem.imagem ? (
            <img
              src={personagem.imagem}
              alt={infoPersonagem.nome}
              className={`w-16 h-16 rounded-full object-cover border-2 ${isSelected ? 'border-cyan-500' : 'border-purple-500'}`}
            />
          ) : (
            <div className="text-3xl">
              {isSelected ? '✨' : '👤'}
            </div>
          )}
        </div>

        <h4 className={`text-lg font-bold mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          {infoPersonagem.nome}
        </h4>

        <div className="space-y-2 text-sm">
          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Nivel:</span>
            <span className="font-semibold">
              {infoPersonagem.nivel}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Classe:</span>
            <span className="font-semibold text-purple-400">
              {infoPersonagem.classe}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Raca:</span>
            <span className="font-semibold text-cyan-400">
              {infoPersonagem.raca}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>HP:</span>
            <span className="font-semibold text-red-400">
              {infoPersonagem.hp}/{infoPersonagem.hpMaximo}
            </span>
          </div>
        </div>

        {isSelected && (
          <div className="mt-4 text-cyan-400 font-semibold text-sm">
            ✅ Selecionado
          </div>
        )}
      </div>
    </div>
  );
};

export default EtapaSelecaoPersonagem;
