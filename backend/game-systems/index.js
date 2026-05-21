import lunariaEngine from './lunaria/index.js';
import tresdetEngine from './tresdet/index.js';
import dnd5eEngine from './dnd5e/index.js';

const engines = {
  lunaria: lunariaEngine,
  tresdet: tresdetEngine,
  dnd5e: dnd5eEngine,
};

export function getEngine(sistema) {
  const engine = engines[sistema];
  if (!engine) throw new Error(`Sistema desconhecido: ${sistema}`);
  return engine;
}

export function getAvailableSystems() {
  return Object.keys(engines);
}
