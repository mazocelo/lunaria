import React, { useState, useEffect, useRef } from 'react';
import { Dice6, Trophy } from 'lucide-react';
import { DICE_ANIMATION } from '../../../constants/game';

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
  const intervaloRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  const jaRolou = resultados[usuarioAtual?.id] !== undefined;
  const totalRolagens = Object.keys(resultados).length;
  const totalJogadores = jogadores.length;

  const handleRolarDado = () => {
    if (jaRolou || animando || !onRolarDado) return;

    setAnimando(true);
    let contador = 0;
    intervaloRef.current = setInterval(() => {
      setDadoLocal(Math.floor(Math.random() * 20) + 1);
      contador += 1;
      if (contador >= DICE_ANIMATION.TOTAL_FRAMES) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
        setAnimando(false);
        setDadoLocal(null);
        onRolarDado();
      }
    }, DICE_ANIMATION.FRAME_INTERVAL);
  };

  if (ordemDefinida) {
    return (
      <div className="game-glass p-6 rounded-2xl border border-purple-500/30 mb-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-white mb-2">
            <Trophy size={24} className="text-amber-300" />
            <h3 className="text-2xl font-fantasy font-bold">Ordem de Jogadores Definida</h3>
          </div>
          <p className="text-purple-300">O jogo comecara do maior para o menor valor.</p>
        </div>

        <div className="space-y-3">
          {ordemJogadores.map((jogador, index) => (
            <div
              key={jogador.userId}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                jogador.userId === usuarioAtual?.id
                  ? 'game-glass border-purple-400'
                  : 'game-glass-subtle border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                  {index + 1}o
                </div>
                <div>
                  <p className="text-white font-semibold">{jogador.username}</p>
                  {jogador.personagemNome && <p className="text-purple-300 text-sm">{jogador.personagemNome}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dice6 size={18} className="text-amber-300" />
                <span className="text-3xl font-bold text-cyan-400">{jogador.valorDado}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-glass p-6 rounded-2xl border border-purple-500/30 mb-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-white mb-2">
          <Dice6 size={24} className="text-amber-300" />
          <h3 className="text-2xl font-fantasy font-bold">Rolagem Inicial</h3>
        </div>
        <p className="text-purple-300">Cada jogador deve rolar um d20 para definir a ordem de jogo.</p>
        <p className="text-purple-400 text-sm mt-2">
          {totalRolagens} de {totalJogadores} jogadores rolaram
        </p>
      </div>

      <div className="text-center mb-6">
        {jaRolou ? (
          <div className="p-4 game-glass-subtle border border-cyan-400/30 rounded-lg">
            <p className="text-cyan-300">
              Voce rolou <span className="font-bold text-cyan-200">{resultados[usuarioAtual.id]?.valor}</span>. Aguardando outros jogadores...
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRolarDado}
            disabled={animando}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {animando ? (
              <span className="flex items-center space-x-2">
                <Dice6 size={24} className="animate-bounce" />
                <span>Rolando... {dadoLocal}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Dice6 size={22} />
                <span>Rolar D20</span>
              </span>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {jogadores.map((jogador) => {
          const resultado = resultados[jogador.userId];
          const ehUsuarioAtual = jogador.userId === usuarioAtual?.id;

          return (
            <div
              key={jogador.userId}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                ehUsuarioAtual
                  ? 'game-glass border-purple-400'
                  : 'game-glass-subtle border-purple-500/20'
              }`}
            >
              <div>
                <p className="text-white font-semibold">
                  {jogador.username || jogador.nome}
                  {ehUsuarioAtual && ' (Voce)'}
                </p>
                {jogador.personagemNome && <p className="text-purple-300 text-sm">{jogador.personagemNome}</p>}
              </div>
              <div>
                {resultado ? (
                  <div className="flex items-center space-x-2">
                    <Dice6 size={18} className="text-amber-300" />
                    <span className="text-2xl font-bold text-cyan-400">{resultado.valor}</span>
                  </div>
                ) : (
                  <span className="text-purple-400 text-sm italic">Aguardando...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RolagemDadosInicial;
