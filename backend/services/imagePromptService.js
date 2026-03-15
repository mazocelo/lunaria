import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { trackLLMUsage } from './llmTracker.js';
import { buildPrompt } from './imageGenerationService.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'imagePromptService' });

const PROVIDER = process.env.IMAGE_PROMPT_PROVIDER || process.env.AI_PROVIDER || 'gemini';
const MODEL = process.env.IMAGE_PROMPT_MODEL || 'gemini-2.5-flash-lite';
const TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are an expert image prompt engineer for AI image generation (Leonardo AI).
Your job: receive structured data about an RPG entity and return a single, optimized English prompt for image generation.

Rules:
- Output ONLY the prompt text, nothing else (no markdown, no quotes, no explanation)
- Maximum 500 characters
- Be vivid, specific, and cinematic
- Include composition, lighting, mood, and atmosphere
- Match the requested visual style exactly
- Never include text/watermarks/logos in the scene description
- For characters: describe pose, expression, attire, environment
- For scenes: describe perspective, foreground/background, weather/time of day
- For maps: describe bird's-eye view, terrain types, landmarks, borders`;

function createModel() {
  const model = MODEL;
  const provider = model.startsWith('gemini') ? 'gemini'
    : model.startsWith('claude') ? 'anthropic'
    : PROVIDER;

  if (provider === 'gemini') {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model,
      temperature: 0.8,
      maxOutputTokens: 300,
    });
  }
  if (provider === 'anthropic') {
    return new ChatAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model,
      temperature: 0.8,
      maxTokens: 300,
    });
  }
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model,
    temperature: 0.8,
    maxTokens: 300,
  });
}

/**
 * Gera um prompt otimizado para imagem via LLM.
 * Fallback automatico para buildPrompt() se a IA falhar.
 *
 * @param {string} entityType - Tipo da entidade (personagem, monstro, etc.)
 * @param {object} entityData - Dados da entidade
 * @param {string} [userId] - ID do usuario (para tracking)
 * @returns {Promise<string>} Prompt otimizado
 */
export async function generateImagePrompt(entityType, entityData, userId) {
  const startTime = Date.now();
  try {
    const model = createModel();

    const userMessage = `Entity type: ${entityType}
Visual style: ${entityData.estilo_imagem || 'fantasy_painting'}
Data: ${JSON.stringify(entityData, null, 0).slice(0, 2000)}

Generate the image prompt:`;

    const response = await Promise.race([
      model.invoke([
        ['system', SYSTEM_PROMPT],
        ['human', userMessage],
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IMAGE_PROMPT_TIMEOUT')), TIMEOUT_MS)),
    ]);

    const prompt = (response.content || '').toString().trim().replace(/^["']|["']$/g, '');

    trackLLMUsage(response, { modelName: MODEL, userId, startTime, agent: 'image-prompt' });

    if (!prompt || prompt.length < 20) {
      log.warn({ entityType, prompt }, 'Prompt da IA muito curto, usando fallback');
      return buildPrompt(entityType, entityData);
    }

    log.info({ entityType, promptLength: prompt.length }, 'Prompt de imagem gerado via IA');
    return prompt;
  } catch (err) {
    log.warn({ err: err.message, entityType }, 'Falha ao gerar prompt via IA, usando fallback');
    return buildPrompt(entityType, entityData);
  }
}
