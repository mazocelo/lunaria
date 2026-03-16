import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { REVIEWER_CONFIG } from './config.js';
import { criarPromptArbitro, montarInputArbitro } from './prompts/arbitroPrompt.js';
import usageService from '../../services/usageService.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'ArbitroMecanico' });

const DEFAULT_VERDICT = { veredicto: 'ok', severidade: 'info', notas: 'revisao nao executada', correcao_sugerida: null };

export class ArbitroMecanico {
  constructor() {
    this.model = null;
    this._inicializarModelo();
  }

  _inicializarModelo() {
    const { name, provider, temperature, maxTokens } = REVIEWER_CONFIG.model;
    try {
      if (provider === 'gemini') {
        this.model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          model: name,
          temperature,
          maxOutputTokens: maxTokens,
        });
      } else if (provider === 'anthropic') {
        this.model = new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: name,
          temperature,
          maxTokens,
        });
      } else {
        this.model = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: name,
          temperature,
          maxTokens,
        });
      }
    } catch (err) {
      log.error({ err: err.message }, 'Erro ao inicializar modelo do Arbitro');
    }
  }

  /**
   * Valida a narrativa contra o resultado mecânico.
   * @returns {Promise<Object>} veredicto
   */
  async validar({ narrativa, resultadoMecanico, personagem, acaoJogador, claimFlags, userId }) {
    if (!this.model) return DEFAULT_VERDICT;

    const startTime = Date.now();
    try {
      const systemPrompt = criarPromptArbitro();
      const userInput = montarInputArbitro({ narrativa, resultadoMecanico, personagem, acaoJogador, claimFlags });

      const response = await Promise.race([
        this.model.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(userInput),
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('REVIEWER_TIMEOUT')), 400)
        ),
      ]);

      const duracao = Date.now() - startTime;
      const text = response?.content || response?.text || '';

      // Track usage
      usageService.track({
        userId,
        provider: REVIEWER_CONFIG.model.provider,
        tipo: 'reviewer_arbitro',
        modelo: REVIEWER_CONFIG.model.name,
        duracao_ms: duracao,
      });

      const verdict = this._parseVerdict(text);
      log.info({ veredicto: verdict.veredicto, severidade: verdict.severidade, duracao }, 'Arbitro concluiu');
      return verdict;
    } catch (err) {
      const duracao = Date.now() - startTime;
      log.warn({ err: err.message, duracao }, 'Arbitro falhou (fail-open)');
      return DEFAULT_VERDICT;
    }
  }

  _parseVerdict(text) {
    try {
      // Remover markdown wrappers
      let clean = text.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(clean);
      // Validar campos obrigatórios
      if (!parsed.veredicto) return DEFAULT_VERDICT;
      return {
        veredicto: parsed.veredicto,
        severidade: parsed.severidade || 'info',
        notas: parsed.notas || '',
        correcao_sugerida: parsed.correcao_sugerida || null,
      };
    } catch {
      log.warn({ raw: text.substring(0, 200) }, 'Falha ao parsear veredicto do Arbitro');
      return DEFAULT_VERDICT;
    }
  }
}
