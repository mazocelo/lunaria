/**
 * Helper de Loot - Rola loot para monstros derrotados e distribui entre jogadores
 */
import db from '../Model/index.js';
import logger from './logger.js';
const log = logger.child({ module: 'lootHelper' });

/** Fisher-Yates shuffle (in-place) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Rola loot para todos os monstros derrotados e distribui entre jogadores
 * @param {Array} monstrosDerrotados - [{monstroDbId, nome}]
 * @param {Array} jogadoresSobreviventes - [{userId, personagemId, personagemNome}]
 * @param {number} nivelMedio - Nivel medio do grupo
 * @returns {{ lootPorJogador: {userId: [items]}, todosItens: [items] }}
 */
export async function rolarLootCombate(monstrosDerrotados, jogadoresSobreviventes, nivelMedio) {
  const todosItens = [];

  // Rolar loot para cada monstro derrotado
  for (const monstro of monstrosDerrotados) {
    if (!monstro.monstroDbId) continue;

    try {
      const drops = await db.MonstroLoot.rolarLoot(monstro.monstroDbId, nivelMedio);
      for (const drop of drops) {
        todosItens.push({
          ...drop,
          origem: 'loot',
          monstroNome: monstro.nome
        });
      }
    } catch (error) {
      log.error({ err: error, monstro: monstro.nome }, 'Erro ao rolar loot do monstro');
    }
  }

  if (todosItens.length === 0 || jogadoresSobreviventes.length === 0) {
    return { lootPorJogador: {}, todosItens: [] };
  }

  // Distribuir round-robin entre jogadores
  const lootPorJogador = {};
  for (const jogador of jogadoresSobreviventes) {
    lootPorJogador[jogador.userId] = [];
  }

  shuffle(todosItens);
  todosItens.forEach((item, index) => {
    const jogador = jogadoresSobreviventes[index % jogadoresSobreviventes.length];
    lootPorJogador[jogador.userId].push(item);
  });

  return { lootPorJogador, todosItens };
}
