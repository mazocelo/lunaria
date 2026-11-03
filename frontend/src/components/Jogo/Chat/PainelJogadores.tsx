import { useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, Dice6, ScrollText, Users, Zap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface ParticipanteEntry {
  userId?: number | string;
  id?: number | string;
  username?: string;
  nome?: string;
  personagemNome?: string;
  personagem?: string;
  valorDado?: number;
  isOwner?: boolean;
  status?: string;
  classe?: string;
  raca?: string;
  [key: string]: unknown;
}

interface CombateOrdemEntry {
  id: string | number;
  nome?: string;
  iniciativa?: number;
}

interface ResultadoDadoEntry {
  valor?: number;
}

interface PainelJogadoresProps {
  participantes: ParticipanteEntry[];
  ordemJogadores?: ParticipanteEntry[];
  resultadosDados?: Record<string | number, ResultadoDadoEntry>;
  turnoAtual?: number | null;
  faseJogo?: string;
  onVerFichaJogador?: (jogador: ParticipanteEntry) => void;
  compactMode?: boolean;
  combateAtivo?: boolean;
  combateOrdemIniciativa?: CombateOrdemEntry[];
}

const PainelJogadores = ({
  participantes,
  ordemJogadores = [],
  resultadosDados = {},
  turnoAtual = null,
  faseJogo = 'aguardando_inicio',
  onVerFichaJogador,
  compactMode = false,
  combateAtivo = false,
  combateOrdemIniciativa = [],
}: PainelJogadoresProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const jogadoresParaExibir = ordemJogadores.length > 0 ? ordemJogadores : participantes;

  const faseChip = faseJogo === 'rolagem_inicial'
    ? { label: 'Rolagem Inicial', className: 'bg-amber-900/30 text-amber-400 border border-amber-500/30' }
    : faseJogo === 'rodada_em_andamento'
      ? { label: 'Em Jogo', className: 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' }
      : faseJogo === 'entre_rodadas'
        ? { label: 'Entre Rodadas', className: 'bg-purple-900/30 text-purple-400 border border-purple-500/30' }
        : { label: 'Aguardando', className: 'bg-purple-900/30 text-purple-400 border border-purple-500/30' };

  const renderJogador = (jogador: ParticipanteEntry, index: number) => {
    const userId = jogador.userId || jogador.id;
    const username = jogador.username || jogador.nome;
    const personagem = jogador.personagemNome || jogador.personagem;
    const combateInit = combateAtivo && combateOrdemIniciativa.find((o) => String(o.id).includes(String(userId)) || o.nome === personagem);
    const valorDado: number | undefined = combateInit
      ? combateInit.iniciativa
      : (jogador.valorDado || (userId != null ? resultadosDados[userId]?.valor : undefined));
    const ehTurnoAtual = turnoAtual === index;
    const ehUsuarioAtual = String(userId) === String(user?.id);

    return (
      <div
        key={userId || index}
        className={`game-glass-subtle p-3 rounded-xl border transition-all ${
          ehTurnoAtual
            ? 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
            : ehUsuarioAtual
              ? 'border-purple-400/30 hover:border-purple-400/50'
              : 'border-white/[0.06] hover:border-purple-400/20'
        }`}
      >
        <div className="flex items-center space-x-3 mb-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              ehTurnoAtual
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                : 'bg-gradient-to-r from-green-500 to-blue-500'
            }`}
          >
            {ordemJogadores.length > 0 ? (
              <span>{index + 1}o</span>
            ) : (
              <span>{username?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm flex items-center gap-1.5">
              <span className="truncate">{personagem || username || 'Jogador'}</span>
              {jogador.isOwner && <Crown size={12} className="text-yellow-400 flex-shrink-0" />}
              {ehUsuarioAtual && <span className="text-purple-400 text-xs flex-shrink-0">(Voce)</span>}
            </div>
            {personagem && <div className="text-purple-300/70 text-xs truncate">{username}</div>}
          </div>

          {ehTurnoAtual && <Zap size={16} className="text-cyan-300 animate-pulse flex-shrink-0" />}
        </div>

        {valorDado && (
          <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <Dice6 size={12} className="text-amber-400" />
            <span className="text-amber-300 font-bold text-sm">{valorDado}</span>
          </div>
        )}

        {!compactMode && (
          <div className="mt-2 text-xs text-purple-200 space-y-1">
            {jogador.status && <p>{jogador.status === 'selecionando' ? 'Selecionando personagem' : jogador.status}</p>}
            {jogador.classe && <p className="text-cyan-200">{jogador.classe}</p>}
            {jogador.raca && <p className="text-green-200">{jogador.raca}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={() => onVerFichaJogador && onVerFichaJogador(jogador)}
          className={`mt-2 rounded-lg border border-purple-400/20 text-purple-200/70 text-xs hover:text-purple-100 hover:border-purple-400/40 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-1.5 ${
            compactMode ? 'px-2 py-1.5 w-auto' : 'px-3 py-1.5 w-full'
          }`}
        >
          <ScrollText size={12} />
          {!compactMode && <span>Ver ficha</span>}
        </button>
      </div>
    );
  };

  return (
    <div className={`transition-all duration-300 game-glass border-r border-white/[0.06] p-4 overflow-y-auto overflow-x-hidden hidden md:block ${
      isExpanded ? (compactMode ? 'w-64' : 'w-80') : 'w-16'
    }`}>
      <div className={`flex items-center mb-2 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        {isExpanded && (
          <h3 className="text-base font-fantasy font-bold text-purple-200/80 uppercase tracking-wider flex items-center gap-2">
            <Users size={16} />
            <span>Aventureiros</span>
          </h3>
        )}

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all transform hover:scale-105 flex-shrink-0"
          title={isExpanded ? 'Retrair painel' : 'Expandir painel'}
          aria-label={isExpanded ? 'Retrair painel' : 'Expandir painel'}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {isExpanded ? (
        <>
          {faseJogo && (
            <div className="mb-4 text-xs text-center">
              <span className={`px-2 py-1 rounded-full ${faseChip.className}`}>{faseChip.label}</span>
            </div>
          )}

          <div className="space-y-3">
            {jogadoresParaExibir.length > 0 ? (
              jogadoresParaExibir.map((jogador, index) => renderJogador(jogador, index))
            ) : (
              <div className="text-center py-8 text-purple-400">
                <Users size={28} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">Aguardando jogadores...</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-2 mt-4">
          {jogadoresParaExibir.slice(0, 3).map((jogador, index) => {
            const ehTurnoAtual = turnoAtual === index;
            return (
              <div
                key={jogador.userId || index}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  ehTurnoAtual
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse shadow-[0_0_18px_rgba(34,211,238,0.2)]'
                    : 'bg-gradient-to-r from-green-500 to-blue-500'
                }`}
                title={jogador.username}
              >
                {index + 1}
              </div>
            );
          })}
          {jogadoresParaExibir.length > 3 && (
            <div className="text-purple-400 text-xs">+{jogadoresParaExibir.length - 3}</div>
          )}
        </div>
      )}

      {isExpanded && !compactMode && ordemJogadores.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <p className="text-purple-300 text-xs text-center mb-2">Legenda</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse" />
              <span className="text-purple-300">Turno atual</span>
            </div>
            <div className="flex items-center gap-2">
              <Dice6 size={12} className="text-amber-400" />
              <span className="text-purple-300">Valor do dado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelJogadores;
