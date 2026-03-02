import React, { useState, useEffect } from 'react';

/**
 * Componente para rolagem de dados inicial (d20) para definir ordem de jogadores
 */
const RolagemDadosInicial = ({ 
  jogadores = [], 
  resultados = {}, 
  ordemDefinida = false, 
  ordemJogadores = [],
  usuarioAtual,
  onRolarDado 
}) => {
  const [animando, setAnimando] = useState(false);
  const [dadoLocal, setDadoLocal] = useState(null);

  // Verificar se usuário já rolou
  const jaRolou = resultados[usuarioAtual?.id] !== undefined;

  // Verificar quantos jogadores já rolaram
  const totalRolagens = Object.keys(resultados).length;
  const totalJogadores = jogadores.length;

  const handleRolarDado = () => {
    if (jaRolou || animando || !onRolarDado) return;

    // Animação do dado
    setAnimando(true);
    let contador = 0;
    const intervalo = setInterval(() => {
      setDadoLocal(Math.floor(Math.random() * 20) + 1);
      contador++;
      if (contador >= 10) {
        clearInterval(intervalo);
        setAnimando(false);
        setDadoLocal(null);
        onRolarDado();
      }
    }, 100);
  };

  if (jaRolou) {
    // Esconder o componente se o jogador já rolou o dado
    return null;
  }

  if (ordemDefinida) {
    // Mostrar ordem final
    return (
      <div className="glass p-6 rounded-2xl border border-purple-500/30 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-fantasy font-bold text-white mb-2">
            🎯 Ordem de Jogadores Definida!
          </h3>
          <p className="text-purple-300">
            O jogo começará em ordem do maior para o menor valor
          </p>
        </div>

        <div className="space-y-3">
          {ordemJogadores.map((jogador, index) => (
            <div 
              key={jogador.userId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                jogador.userId === usuarioAtual?.userId
                  ? 'bg-purple-500/20 border-purple-400'
                  : 'bg-black/20 border-purple-500/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                  {index + 1}º
                </div>
                <div>
                  <p className="text-white font-semibold">{jogador.username}</p>
                  {jogador.personagemNome && (
                    <p className="text-purple-300 text-sm">{jogador.personagemNome}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎲</span>
                <span className="text-3xl font-bold text-cyan-400">{jogador.valorDado}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl border border-purple-500/30 mb-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-fantasy font-bold text-white mb-2">
          🎲 Rolagem de Dados Inicial
        </h3>
        <p className="text-purple-300">
          Cada jogador deve rolar um d20 para definir a ordem de jogo
        </p>
        <p className="text-purple-400 text-sm mt-2">
          {totalRolagens} de {totalJogadores} jogadores rolaram
        </p>
      </div>

      {/* Botão de rolar dado */}
      <div className="text-center mb-6">
        <button
          onClick={handleRolarDado}
          disabled={animando}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {animando ? (
            <span className="flex items-center space-x-2">
              <span className="text-3xl animate-bounce">🎲</span>
              <span>Rolando... {dadoLocal}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span className="text-2xl">🎲</span>
              <span>Rolar D20</span>
            </span>
          )}
        </button>
      </div>

      {/* Lista de resultados */}
      <div className="space-y-2">
        {jogadores.map((jogador) => {
          const resultado = resultados[jogador.userId];
          const ehUsuarioAtual = jogador.userId === usuarioAtual?.userId;

          return (
            <div
              key={jogador.userId}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                ehUsuarioAtual
                  ? 'bg-purple-500/20 border-purple-400'
                  : 'bg-black/20 border-purple-500/20'
              }`}
            >
              <div>
                <p className="text-white font-semibold">
                  {jogador.username || jogador.nome}
                  {ehUsuarioAtual && ' (Você)'}
                </p>
                {jogador.personagemNome && (
                  <p className="text-purple-300 text-sm">{jogador.personagemNome}</p>
                )}
              </div>
              <div>
                {resultado ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🎲</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {resultado.valor}
                    </span>
                  </div>
                ) : (
                  <span className="text-purple-400 text-sm italic">
                    Aguardando...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem para usuário que já rolou */}
      {jaRolou && (
        <div className="mt-4 p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-center">
          <p className="text-cyan-300">
            ✅ Você rolou <span className="font-bold">{resultados[usuarioAtual.userId].valor}</span>! Aguarde os outros jogadores.
          </p>
        </div>
      )}
    </div>
  );
};

export default RolagemDadosInicial;

