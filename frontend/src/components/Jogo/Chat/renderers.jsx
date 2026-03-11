import React from 'react';
import MarkdownRenderer from '../../MarkdownRenderer';

const getConteudo = (msg) => msg.message || msg.mensagem;

export const renderDado = (mensagem, key) => {
  const modBase = (mensagem.modificador || 0) + (mensagem.bonusNivel || 0);
  const temModBase = modBase !== 0;
  const detalhes = mensagem.detalhesBonus || [];
  const temDetalhes = detalhes.length > 0;
  return (
    <div key={key} className="w-full animate-fade-in">
      <div className="glass p-4 rounded-xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-900/40 to-orange-900/40 shadow-xl">
        <div className="flex items-center justify-center space-x-3">
          <span className="text-4xl drop-shadow-lg">🎲</span>
          <div className="text-center">
            <p className="text-white font-bold text-base mb-1">
              {mensagem.username} rolou {mensagem.dice || 'd20'}
            </p>
            <p className="text-amber-300 text-2xl font-bold drop-shadow-lg">
              Resultado: {mensagem.rolagemBruta || mensagem.result || mensagem.valor || '?'}
              {temModBase && (
                <span className="text-lg">
                  {' '}{modBase > 0 ? '+' : ''}{modBase} ({mensagem.atributoNome || 'Sorte'})
                </span>
              )}
              {temDetalhes && detalhes.map((d, i) => (
                <span key={i} className="text-lg text-cyan-300">
                  {' '}{d.valor > 0 ? '+' : ''}{d.valor} ({d.fonte})
                </span>
              ))}
              {(temModBase || temDetalhes) && (
                <span className="text-lg"> = {mensagem.total}</span>
              )}
            </p>
            {mensagem.descricaoResultado && (
              <p className={`text-sm font-bold mt-1 ${mensagem.sucesso ? 'text-green-400' : 'text-red-400'}`}>
                {mensagem.descricaoResultado} (DC {mensagem.dc})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderRoleplay = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-5 rounded-xl border-2 border-gray-500/40 bg-gray-900/30 shadow-lg">
      <div className="flex items-start space-x-3">
        <span className="text-2xl">💬</span>
        <div className="flex-1">
          <p className="text-gray-300 text-sm font-semibold mb-2">
            {mensagem.username} <span className="italic text-gray-400">(roleplay)</span>
          </p>
          <p className="text-gray-100 text-base italic leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const renderLoading = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-4 rounded-xl border-2 border-purple-500/40 bg-purple-900/20">
      <div className="flex items-center justify-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
        </div>
        <p className="text-purple-300 font-semibold">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderCombate = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-5 rounded-xl border-2 border-red-500/60 bg-gradient-to-br from-red-900/30 to-orange-900/20 shadow-xl">
      <div className="flex items-start space-x-3">
        <span className="text-3xl drop-shadow-lg">⚔️</span>
        <div className="flex-1">
          <p className="text-red-300 font-bold text-sm mb-2">
            Combate
            {mensagem.critico && <span className="text-yellow-300 ml-2">ACERTO CRITICO!</span>}
          </p>
          <p className="text-white text-base leading-relaxed">
            {getConteudo(mensagem)}
          </p>
          {mensagem.dano > 0 && (
            <p className="text-orange-300 text-sm mt-1 font-semibold">
              -{mensagem.dano} HP
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const renderTransicaoTurno = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in my-3">
    <div className="glass p-3 rounded-xl border border-cyan-500/50 bg-cyan-900/20">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">🏁</span>
        <p className="text-cyan-200 font-semibold text-sm">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderAguardandoDados = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in my-3">
    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">⏳</span>
        <p className="text-amber-300 font-semibold">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderEntreRodadas = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in my-8">
    <div className="glass p-8 rounded-2xl border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 shadow-2xl">
      <div className="text-center mb-4">
        <span className="text-6xl drop-shadow-lg">🌟</span>
        <h3 className="text-3xl font-fantasy font-bold text-cyan-300 mt-3 drop-shadow-lg">
          {mensagem.titulo || 'Fim de Rodada'}
        </h3>
      </div>
      <p className="text-white text-xl leading-relaxed text-center">
        {getConteudo(mensagem) || mensagem.narrativa}
      </p>
    </div>
  </div>
);

export const renderMestre = (mensagem, key) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = /🎲.*[Rr]ole/i.test(conteudo);

  return (
    <div key={key} className="w-full animate-fade-in">
      <div className={`glass p-6 rounded-xl border-2 shadow-2xl ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-4">
          <span className="text-4xl drop-shadow-lg">
            {temSolicitacaoDados ? '🎲' : '🎭'}
          </span>
          <div className="flex-1">
            <p className={`font-bold text-lg mb-2 ${
              temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
            }`}>
              Mestre {temSolicitacaoDados && '- Solicita Rolagem!'}
            </p>
            <MarkdownRenderer className="text-white text-lg leading-relaxed">
              {conteudo}
            </MarkdownRenderer>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MestreMessage - Componente React para mensagens do mestre com TTS
 * Recebe instância compartilhada de useTTS via props (do ChatArea)
 */
export const MestreMessage = ({ mensagem, voiceId, voiceProvider, tts }) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = /🎲.*[Rr]ole/i.test(conteudo);
  const isThisPlaying = tts.currentMessageId === mensagem.id;
  // Usar voice da mensagem (permanente) com fallback para props (sessão atual)
  const effectiveVoiceId = mensagem.voice_id || voiceId;
  const effectiveVoiceProvider = mensagem.voice_provider || voiceProvider;

  return (
    <div className="w-full animate-fade-in">
      <div className={`glass p-6 rounded-xl border-2 shadow-2xl ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-4">
          <span className="text-4xl drop-shadow-lg">
            {temSolicitacaoDados ? '🎲' : '🎭'}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className={`font-bold text-lg ${
                temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
              }`}>
                Mestre {temSolicitacaoDados && '- Solicita Rolagem!'}
              </p>
              {effectiveVoiceId && (
                <button
                  onClick={() => tts.play(conteudo, effectiveVoiceId, mensagem.id, effectiveVoiceProvider)}
                  disabled={tts.isLoading && isThisPlaying}
                  className={`p-1.5 rounded-lg transition-all text-lg ${
                    isThisPlaying && tts.isPlaying
                      ? 'bg-purple-500/30 text-purple-200'
                      : 'hover:bg-white/10 text-purple-400 hover:text-purple-200'
                  }`}
                  title={isThisPlaying && tts.isPlaying ? 'Parar narração' : 'Ouvir narração'}
                >
                  {tts.isLoading && isThisPlaying ? (
                    <span className="inline-block w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                  ) : isThisPlaying && tts.isPlaying ? '⏹' : '🔊'}
                </button>
              )}
            </div>
            <MarkdownRenderer className="text-white text-lg leading-relaxed">
              {conteudo}
            </MarkdownRenderer>
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderJogador = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-6 rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 shadow-xl">
      <div className="flex items-start space-x-4">
        <span className="text-3xl drop-shadow-lg">⚔️</span>
        <div className="flex-1">
          <p className="text-cyan-300 font-bold text-lg mb-2">
            {mensagem.username}
            {mensagem.personagem && (
              <span className="text-cyan-400 text-base ml-2">
                ({mensagem.personagem})
              </span>
            )}
          </p>
          <p className="text-white text-base leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Registry: tipo → renderer (com aliases)
 */
export const MESSAGE_RENDERERS = {
  dado: renderDado,
  dados: renderDado,
  dice_roll: renderDado,
  roleplay: renderRoleplay,
  loading: renderLoading,
  combate: renderCombate,
  transicao_turno: renderTransicaoTurno,
  aguardando_dados: renderAguardandoDados,
  entre_rodadas: renderEntreRodadas,
  rodada_finalizada: renderEntreRodadas,
  mestre: renderMestre,
  jogador: renderJogador,
  player: renderJogador,
};
