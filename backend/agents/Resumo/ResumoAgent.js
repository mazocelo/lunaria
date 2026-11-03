import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
import { trackLLMUsage } from '../../services/llmTracker.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'ResumoAgent' });

dotenv.config();

/**
 * Agente responsavel por resumir aventuras de RPG
 * Condensa o historico canonico de mensagens para manter o contexto do Mestre eficiente.
 */
export class ResumoAgent {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.3,
      maxOutputTokens: 2000,
    });
  }

  _filtrarMensagensCanonicas(mensagens = []) {
    return (mensagens || []).filter((mensagem) => {
      const canal = mensagem?.canal || 'formal';
      const tipo = mensagem?.tipo || mensagem?.type;
      return canal !== 'roleplay' && tipo !== 'roleplay';
    });
  }

  _formatarMensagens(mensagens = []) {
    return mensagens.map((mensagem) => {
      const tipo = mensagem?.tipo || mensagem?.type || 'desconhecido';
      const autor = mensagem?.username || 'Sistema';
      const texto = (mensagem?.mensagem || mensagem?.message || '').substring(0, 150);
      return `[${tipo.toUpperCase()}] ${autor}: ${texto}`;
    }).join('\n');
  }

  _chunkMensagens(mensagens = [], chunkSize = 120) {
    const chunks = [];
    for (let index = 0; index < mensagens.length; index += chunkSize) {
      chunks.push(mensagens.slice(index, index + chunkSize));
    }
    return chunks;
  }

  async _executarResumo({
    mensagensCanonicas,
    temas,
    personagens,
    rodadasJogadas,
    resumoAnterior = null,
    userId = null,
    contextoResumo = null
  }) {
    const blocoAnterior = resumoAnterior
      ? `\nRESUMO ANTERIOR (consolidar com as novas informacoes):\n${resumoAnterior}\n`
      : '';
    const mensagensFormatadas = this._formatarMensagens(mensagensCanonicas);
    const prompt = this._buildStructuredPrompt(
      temas,
      personagens,
      rodadasJogadas,
      mensagensCanonicas.length,
      blocoAnterior,
      resumoAnterior,
      mensagensFormatadas,
      mensagensCanonicas.length,
      contextoResumo
    );

    const startTime = Date.now();
    const response = await this.model.invoke(prompt);
    trackLLMUsage(response, {
      modelName: 'openai/gpt-oss-120b',
      userId,
      startTime,
      agent: 'ResumoAgent'
    });
    return response.content;
  }

  async resumirAventura({ mensagens, temas, personagens, rodadasJogadas, resumoAnterior = null, userId, contextoResumo = null }) {
    try {
      const mensagensCanonicas = this._filtrarMensagensCanonicas(mensagens);
      const blocos = this._chunkMensagens(mensagensCanonicas, 120);
      let resumoConsolidado = resumoAnterior || null;

      if (blocos.length === 0) {
        resumoConsolidado = resumoAnterior || '';
      } else {
        for (const bloco of blocos) {
          resumoConsolidado = await this._executarResumo({
            mensagensCanonicas: bloco,
            temas,
            personagens,
            rodadasJogadas,
            resumoAnterior: resumoConsolidado,
            userId,
            contextoResumo
          });
        }
      }

      log.info('Resumo gerado com sucesso');

      return {
        resumo: resumoConsolidado,
        mensagensResumidas: mensagensCanonicas.length,
        rodadasResumiadas: rodadasJogadas,
        geradoEm: new Date().toISOString(),
        formato: 'estruturado'
      };
    } catch (error) {
      log.error({ err: error }, 'Erro ao gerar resumo');
      throw new Error(`Erro ao gerar resumo: ${error.message}`);
    }
  }

  _formatContextoResumo(contextoResumo) {
    if (!contextoResumo) return '';
    const parts = [];
    if (contextoResumo.cenaAtual) parts.push(`- Cena atual: ${contextoResumo.cenaAtual}`);
    if (contextoResumo.terreno) parts.push(`- Terreno: ${contextoResumo.terreno}`);
    if (contextoResumo.tensao) parts.push(`- Tensao: ${contextoResumo.tensao}`);
    if (contextoResumo.boss) parts.push(`- Boss ativo: ${contextoResumo.boss}`);
    if (contextoResumo.batalha) parts.push(`- Batalha: ${contextoResumo.batalha}`);
    if (contextoResumo.missao) parts.push(`- Missao tatica: ${contextoResumo.missao}`);
    if (contextoResumo.recursos) parts.push(`- Recursos: ${contextoResumo.recursos}`);
    if (parts.length === 0) return '';
    return `\nESTADO ATUAL DA SESSAO (use para preencher CENARIO_ATUAL, TERRENO_ATUAL, RECURSOS_CONSUMIDOS e MORAL_GRUPO):\n${parts.join('\n')}\n`;
  }

  _buildStructuredPrompt(temas, personagens, rodadasJogadas, totalMensagens, blocoAnterior, resumoAnterior, mensagensFormatadas, qtdMensagens, contextoResumo = null) {
    const blocoContexto = this._formatContextoResumo(contextoResumo);
    return `Voce e um assistente que resume aventuras de RPG em formato ESTRUTURADO.

CONTEXTO:
- Temas: ${temas.join(', ')}
- Personagens: ${personagens.map(p => p.personagemNome || p.username || p.nome || p).join(', ')}
- Rodadas Jogadas: ${rodadasJogadas}
- Total de Mensagens: ${totalMensagens}
${blocoAnterior}${blocoContexto}
${resumoAnterior ? 'Consolide o resumo anterior com as novas informacoes em um UNICO resumo estruturado.' : 'Crie um resumo estruturado.'}

FORMATO OBRIGATORIO (use exatamente estas secoes, omita secoes vazias):

FATOS:
- [Eventos objetivos que aconteceram, em ordem cronologica]

ITENS:
- [Jogador]: ganhou [item] / perdeu [item]

NPCS:
- [Nome do NPC]: [status - aliado/neutro/hostil/morto] — [nota breve]

COMBATE:
- [Estado atual: fora de combate / em combate contra X / combate encerrado]

DECISOES:
- [Decisoes importantes tomadas pelos jogadores]

PISTAS:
- [Informacoes descobertas, segredos revelados]

DESVANTAGENS_ATIVADAS:
- [Desvantagem]: [resultado]

CENARIO_ATUAL:
- [Cena/local onde o grupo esta agora]

TERRENO_ATUAL:
- [Tipo de terreno e condicoes ambientais relevantes]

RECURSOS_CONSUMIDOS:
- [HP, mana, itens consumiveis usados — resumo geral do grupo]

MORAL_GRUPO:
- [Estado emocional/moral do grupo: determinado/abalado/dividido/etc]

Maximo 600 palavras. Use topicos curtos, NAO paragrafos.

MENSAGENS RECENTES (${qtdMensagens}):
${mensagensFormatadas}

RESUMO ESTRUTURADO:`;
  }
}

export default new ResumoAgent();
