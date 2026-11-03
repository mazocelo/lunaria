import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { REVIEWER_CONFIG } from './config.js';
import { criarPromptGancho, montarInputGancho } from './prompts/ganchoPrompt.js';
import usageService from '../../services/usageService.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'GanchoNarrativo' });

const DEFAULT_VERDICT = {
  veredicto: 'ok',
  severidade: 'info',
  notas: 'revisao nao executada',
  correcao_sugerida: null
};

export class GanchoNarrativo {
  constructor() {
    this.model = null;
    this._initFailed = false;
    this._initWarnLogged = false;
    this._inicializarModelo();
  }

  _inicializarModelo() {
    const { name, provider, temperature, maxTokens } = REVIEWER_CONFIG.model;

    const keyMap = { gemini: 'GOOGLE_API_KEY', anthropic: 'ANTHROPIC_API_KEY', groq: 'GROQ_API_KEY' };
    const envKey = keyMap[provider] || 'GROQ_API_KEY';
    if (!process.env[envKey]) {
      log.error({ provider, envVar: envKey }, 'REVIEWER_API_KEY_MISSING — reviewer will be non-functional');
      this._initFailed = true;
      return;
    }

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
      log.error({ err: err.message }, 'Erro ao inicializar modelo do revisor de gancho');
      this._initFailed = true;
    }
  }

  async validar({ narrativa, shouldSuggest = false, combateAtivo = false, userId }) {
    if (!this.model || this._initFailed) {
      if (!this._initWarnLogged) {
        log.error({ reviewer: 'GanchoNarrativo' }, 'REVIEWER_INIT_FAILED — returning default verdict');
        this._initWarnLogged = true;
      }
      return DEFAULT_VERDICT;
    }

    const startTime = Date.now();
    try {
      const response = await Promise.race([
        this.model.invoke([
          new SystemMessage(criarPromptGancho()),
          new HumanMessage(montarInputGancho({ narrativa, shouldSuggest, combateAtivo })),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('REVIEWER_TIMEOUT')), REVIEWER_CONFIG.model.timeout))
      ]);

      usageService.track({
        userId,
        provider: REVIEWER_CONFIG.model.provider,
        tipo: 'reviewer_gancho',
        modelo: REVIEWER_CONFIG.model.name,
        duracao_ms: Date.now() - startTime,
      });

      return this._parseVerdict(response?.content || response?.text || '');
    } catch (err) {
      log.warn({ err: err.message }, 'Revisor de gancho falhou (fail-open)');
      return DEFAULT_VERDICT;
    }
  }

  _parseVerdict(text) {
    try {
      let clean = String(text || '').trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(clean);
      if (!parsed.veredicto) return DEFAULT_VERDICT;
      return {
        veredicto: parsed.veredicto,
        severidade: parsed.severidade || 'info',
        notas: parsed.notas || '',
        correcao_sugerida: parsed.correcao_sugerida || null,
      };
    } catch {
      log.warn({ raw: String(text || '').slice(0, 200) }, 'Falha ao parsear veredicto do GanchoNarrativo');
      return DEFAULT_VERDICT;
    }
  }
}
