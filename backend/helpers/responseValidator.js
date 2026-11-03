import logger from './logger.js';
const log = logger.child({ module: 'responseValidator' });

export function validateMestreResponse(resposta, estadoJogo) {
  if (!resposta || !estadoJogo) return;
  const combateAtivo = estadoJogo?.combate?.ativo === true;

  if (combateAtivo && resposta.fimDeTurno === true) {
    log.warn('LLM enviou fimDeTurno:true durante combate. Forcando false.');
    resposta.fimDeTurno = false;
  }

  if (combateAtivo && Array.isArray(resposta.acoes)) {
    resposta.acoes = resposta.acoes.filter(a => {
      if (a.tipo === 'mudar_cenario') {
        log.warn({ acao: a }, 'mudar_cenario rejeitado durante combate');
        return false;
      }
      return true;
    });
  }

  if (combateAtivo && resposta.arcoStatus?.concluido) {
    log.warn('LLM enviou arcoStatus.concluido durante combate. Ignorando.');
    resposta.arcoStatus = null;
  }

  if (combateAtivo && resposta.metadados?.local_atual) {
    log.warn({ local: resposta.metadados.local_atual }, 'local_atual ignorado durante combate');
    delete resposta.metadados.local_atual;
  }
}
