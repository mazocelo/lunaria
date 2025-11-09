/**
 * Exportação principal do módulo Mestre
 */

export { MestreAgent, criarMestreRPG } from './MestreAgent.js';
export { MESTRE_CONFIG } from './config.js';
export { criarPromptSistema } from './prompts/sistema.js';
export { criarPromptNarracao } from './prompts/narracao.js';
export { criarPromptInicio, criarPromptBoasVindas } from './prompts/inicio.js';
export { formatarMensagemJogador, formatarRespostaMestre, extrairInfoPersonagem } from './utils/formatacao.js';
export { converterHistoricoParaLangChain, limitarHistorico, adicionarMensagem } from './utils/historico.js';

// Export default como factory function
import criarMestreRPG from './MestreAgent.js';
export default criarMestreRPG;

