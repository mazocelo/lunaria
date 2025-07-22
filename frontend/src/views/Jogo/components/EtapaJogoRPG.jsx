import React, { useState } from 'react';
import { RPGActions } from '../../../components/RPGActions';
import BackgroundEffects from './shared/BackgroundEffects';
import HeaderJogoRPG from './rpg/HeaderJogoRPG';
import PainelJogadores from './rpg/PainelJogadores';
import ChatArea from './rpg/ChatArea';
import InputArea from './rpg/InputArea';
import StatusPersonagem from './rpg/StatusPersonagem';

/**
 * Layout do jogo RPG ativo - Conectado diretamente aos stores
 * 📍 Usado por: JogoView (etapa 'jogo-ativo')
 */
const EtapaJogoRPG = ({
  historia,
  personagemSelecionado,
  participantes,
  mensagens,
  statusPersonagem,
  isDonoSala,
  socketConnected,
  isTyping,
  onAdicionarMensagem,
  onAtualizarStatus,
  onSair
}) => {
  const [showActions, setShowActions] = useState(false);
  const [mensagemAtual, setMensagemAtual] = useState('');

  const handleMensagemChange = (e) => {
    setMensagemAtual(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  const handleEnviarMensagem = () => {
    if (!mensagemAtual.trim()) return;
    
    const novaMensagem = {
      id: Date.now(),
      autor: 'Você',
      conteudo: mensagemAtual,
      tipo: 'chat',
      timestamp: new Date()
    };
    
    console.log('📍 EtapaJogoRPG: Enviando mensagem:', novaMensagem);
    onAdicionarMensagem(novaMensagem);
    setMensagemAtual('');
  };

  const handleRolarDados = () => {
    const resultado = Math.floor(Math.random() * 20) + 1;
    const mensagemDados = {
      id: Date.now(),
      autor: 'Sistema',
      conteudo: `🎲 Você rolou: ${resultado}`,
      tipo: 'dados',
      timestamp: new Date()
    };
    
    console.log('🎲 EtapaJogoRPG: Rolando dados:', resultado);
    onAdicionarMensagem(mensagemDados);
  };

  const handleExecutarAcao = (acao) => {
    const mensagemAcao = {
      id: Date.now(),
      autor: 'Você',
      conteudo: `⚔️ ${acao}`,
      tipo: 'acao',
      timestamp: new Date()
    };
    
    console.log('⚔️ EtapaJogoRPG: Executando ação:', acao);
    onAdicionarMensagem(mensagemAcao);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffects particleCount={50} />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header Compact */}
        <HeaderJogoRPG
          historia={historia}
          participantes={participantes}
          showActions={showActions}
          setShowActions={setShowActions}
          onSairJogo={onSair}
          socketStatus={socketConnected}
        />

        {/* Main Game Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Painel Lateral Esquerdo - Outros Jogadores */}
          <PainelJogadores participantes={participantes} />

          {/* Área Central - Chat do Mestre */}
          <div className="flex-1 flex flex-col">
            <ChatArea 
              mensagens={mensagens}
              usuariosDigitando={isTyping}
              mensagensRef={null} // No longer needed
            />

            {/* Área de Input - Chat */}
            <InputArea
              mensagemAtual={mensagemAtual}
              onMensagemChange={handleMensagemChange}
              onKeyPress={handleKeyPress}
              onEnviarMensagem={handleEnviarMensagem}
              onRolarDados={handleRolarDados}
              onExecutarAcao={handleExecutarAcao}
            />
          </div>

          {/* Painel Lateral Direito - Ações RPG */}
          {showActions && (
            <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg">🎲 Ações RPG</h3>
                <RPGActions
                  onRolarDados={handleRolarDados}
                  onExecutarAcao={handleExecutarAcao}
                />
                
                {/* Status do personagem */}
                <div className="border-t border-purple-500/20 pt-4">
                  <h4 className="text-white font-semibold mb-2">📊 Status</h4>
                  <StatusPersonagem
                    personagem={personagemSelecionado}
                    status={statusPersonagem}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Painel Inferior - Dados do Seu Personagem */}
        <StatusPersonagem
          personagemSelecionado={personagemSelecionado}
          onRolarDados={handleRolarDados}
        />
      </div>
    </div>
  );
};

export default EtapaJogoRPG;