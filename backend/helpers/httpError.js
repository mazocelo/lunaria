/**
 * Cria um Error com statusCode anexado, para que os controllers possam
 * mapea-lo direto para uma resposta HTTP (ver catch de criarPersonagem).
 * @param {number} statusCode
 * @param {string} message
 * @returns {Error}
 */
export function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}
