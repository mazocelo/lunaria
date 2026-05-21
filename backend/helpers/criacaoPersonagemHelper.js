import { ATRIBUTO_IDS, CRIACAO_ATRIBUTO_MIN, CRIACAO_ATRIBUTO_MAX, CRIACAO_ATRIBUTO_TOTAL } from '../game-systems/lunaria/constants.js';

const ATRIBUTO_TOTAL_CRIACAO = CRIACAO_ATRIBUTO_TOTAL;
const ATRIBUTO_MIN_CRIACAO = CRIACAO_ATRIBUTO_MIN;
const ATRIBUTO_MAX_CRIACAO = CRIACAO_ATRIBUTO_MAX;
const ATRIBUTO_KEYS = ATRIBUTO_IDS;

export function validarAtributosCriacao(atributos) {
  const erros = [];
  let soma = 0;

  for (const nome of ATRIBUTO_KEYS) {
    const valor = parseInt(atributos?.[nome], 10) || 0;
    if (valor < ATRIBUTO_MIN_CRIACAO || valor > ATRIBUTO_MAX_CRIACAO) {
      erros.push(`${nome} deve estar entre ${ATRIBUTO_MIN_CRIACAO} e ${ATRIBUTO_MAX_CRIACAO} na criacao (atual: ${valor})`);
    }
    soma += valor;
  }

  if (soma !== ATRIBUTO_TOTAL_CRIACAO) {
    erros.push(`Total de atributos na criacao deve ser ${ATRIBUTO_TOTAL_CRIACAO} (atual: ${soma})`);
  }

  return { valido: erros.length === 0, erros, soma };
}

export const CRIACAO_PERSONAGEM = {
  ATRIBUTO_TOTAL_CRIACAO,
  ATRIBUTO_MIN_CRIACAO,
  ATRIBUTO_MAX_CRIACAO,
  ATRIBUTO_KEYS,
};

export default {
  validarAtributosCriacao,
  CRIACAO_PERSONAGEM,
};
