import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import { isEnabled } from '../../config/featureFlags.js';
import { trackLLMUsage } from '../../services/llmTracker.js';

dotenv.config();

/**
 * Agente responsável por resumir aventuras de RPG
 * Condensa o histórico de mensagens para manter o contexto do Mestre eficiente
 */
export class ResumoAgent {
  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.3, // Baixa criatividade para resumo fiel
      maxTokens: 2000
    });
  }

  /**
   * Resumir a aventura até o momento
   * @param {Object} params - Parâmetros do resumo
   * @param {Array} params.mensagens - Array de mensagens da sessão
   * @param {Array<string>} params.temas - Temas da aventura
   * @param {Array} params.personagens - Personagens jogando
   * @param {number} params.rodadasJogadas - Número de rodadas jogadas
   * @returns {Promise<Object>} - Resumo gerado
   */
  async resumirAventura({ mensagens, temas, personagens, rodadasJogadas, resumoAnterior = null, userId }) {
    try {
      const mensagensCanonicas = (mensagens || []).filter((mensagem) => {
        const canal = mensagem?.canal || 'formal';
        const tipo = mensagem?.tipo || mensagem?.type;
        return canal !== 'roleplay' && tipo !== 'roleplay';
      });
      const ultimasMensagens = mensagensCanonicas.slice(-50);

      const blocoAnterior = resumoAnterior
        ? `\nRESUMO ANTERIOR (consolidar com as novas informações):\n${resumoAnterior}\n`
        : '';

      const mensagensFormatadas = ultimasMensagens.map(m => {
        const tipo = m.tipo || m.type || 'desconhecido';
        const autor = m.username || 'Sistema';
        const texto = (m.mensagem || m.message || '').substring(0, 150);
        return `[${tipo.toUpperCase()}] ${autor}: ${texto}`;
      }).join('\n');

      const prompt = isEnabled('STRUCTURED_SUMMARY')
        ? this._buildStructuredPrompt(temas, personagens, rodadasJogadas, mensagensCanonicas.length, blocoAnterior, resumoAnterior, mensagensFormatadas, ultimasMensagens.length)
        : this._buildNarrativePrompt(temas, personagens, rodadasJogadas, mensagensCanonicas.length, blocoAnterior, resumoAnterior, mensagensFormatadas, ultimasMensagens.length);

      const startTime = Date.now();
      const response = await this.model.invoke(prompt);
      trackLLMUsage(response, { modelName: 'meta-llama/llama-4-scout-17b-16e-instruct', userId, startTime, agent: 'ResumoAgent' });

      console.log('✅ ResumoAgent: Resumo gerado com sucesso');

      return {
        resumo: response.content,
        mensagensResumiadas: mensagensCanonicas.length,
        rodadasResumiadas: rodadasJogadas,
        geradoEm: new Date().toISOString(),
        formato: isEnabled('STRUCTURED_SUMMARY') ? 'estruturado' : 'narrativo'
      };
    } catch (error) {
      console.error('❌ ResumoAgent: Erro ao gerar resumo:', error);
      throw new Error(`Erro ao gerar resumo: ${error.message}`);
    }
  }

  /**
   * Prompt narrativo (legado)
   */
  _buildNarrativePrompt(temas, personagens, rodadasJogadas, totalMensagens, blocoAnterior, resumoAnterior, mensagensFormatadas, qtdMensagens) {
    return `Você é um assistente que resume aventuras de RPG de forma concisa.

CONTEXTO:
- Temas: ${temas.join(', ')}
- Personagens: ${personagens.map(p => p.personagemNome || p.username || p.nome || p).join(', ')}
- Rodadas Jogadas: ${rodadasJogadas}
- Total de Mensagens: ${totalMensagens}
${blocoAnterior}
${resumoAnterior ? 'Consolide o resumo anterior com as novas mensagens abaixo em um ÚNICO resumo coeso.' : 'Crie um resumo'} MUITO CONCISO (máximo 300 palavras) cobrindo:
1. Principais eventos ocorridos
2. Decisões importantes dos jogadores
3. Situação/desafio atual
4. NPCs ou inimigos encontrados

MENSAGENS RECENTES (${qtdMensagens}):
${mensagensFormatadas}

RESUMO CONCISO:`;
  }

  /**
   * Prompt estruturado (STRUCTURED_SUMMARY=true)
   * Gera resumo em tópicos objetivos, máximo 500 palavras
   */
  _buildStructuredPrompt(temas, personagens, rodadasJogadas, totalMensagens, blocoAnterior, resumoAnterior, mensagensFormatadas, qtdMensagens) {
    return `Você é um assistente que resume aventuras de RPG em formato ESTRUTURADO.

CONTEXTO:
- Temas: ${temas.join(', ')}
- Personagens: ${personagens.map(p => p.personagemNome || p.username || p.nome || p).join(', ')}
- Rodadas Jogadas: ${rodadasJogadas}
- Total de Mensagens: ${totalMensagens}
${blocoAnterior}
${resumoAnterior ? 'Consolide o resumo anterior com as novas informações em um ÚNICO resumo estruturado.' : 'Crie um resumo estruturado.'}

FORMATO OBRIGATÓRIO (use exatamente estas seções, omita seções vazias):

FATOS:
- [Eventos objetivos que aconteceram, em ordem cronológica]

ITENS:
- [Jogador]: ganhou [item] / perdeu [item]

NPCS:
- [Nome do NPC]: [status - aliado/neutro/hostil/morto] — [nota breve]

COMBATE:
- [Estado atual: fora de combate / em combate contra X / combate encerrado]

DECISOES:
- [Decisões importantes tomadas pelos jogadores]

PISTAS:
- [Informações descobertas, segredos revelados]

DESVANTAGENS_ATIVADAS:
- [Desvantagem]: [resultado]

Máximo 500 palavras. Use tópicos curtos, NÃO parágrafos.

MENSAGENS RECENTES (${qtdMensagens}):
${mensagensFormatadas}

RESUMO ESTRUTURADO:`;
  }
}

export default new ResumoAgent(); // Singleton

