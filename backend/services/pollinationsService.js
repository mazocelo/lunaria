import logger from '../helpers/logger.js';
import r2StorageService from './r2StorageService.js';

const log = logger.child({ module: 'pollinationsService' });

const BASE_URL = 'https://image.pollinations.ai/prompt';
const TIMEOUT_MS = 120_000; // Pollinations pode demorar mais
const MAX_RETRIES = 2;

/**
 * Gera imagem via Pollinations.ai (Flux) — 100% grátis, sem API key.
 *
 * Retorna URL da imagem gerada. Se R2 estiver configurado, faz re-upload
 * para storage próprio (URLs do Pollinations são efêmeras).
 */
async function generateImagePollinations(prompt, options = {}) {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const model = options.model || 'flux';
  const seed = options.seed || Math.floor(Math.random() * 999999);
  const nologo = true;
  const enhance = true;

  // Pollinations usa URL encoding do prompt
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `${BASE_URL}/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=${nologo}&enhance=${enhance}`;

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log.info({ attempt, promptLength: prompt.length }, 'Gerando imagem via Pollinations');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Pollinations HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        const body = await response.text();
        throw new Error(`Pollinations retornou content-type inesperado: ${contentType} - ${body.slice(0, 200)}`);
      }

      // Se R2 configurado, salva no storage próprio (URLs Pollinations são temporárias)
      if (r2StorageService.isConfigured()) {
        try {
          const buffer = Buffer.from(await response.arrayBuffer());
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const key = `images/pollinations/${options.entityType || 'misc'}/${options.entityId || seed}-${Date.now()}.${ext}`;
          const r2Url = await r2StorageService.upload(key, buffer, contentType);
          log.info({ key }, 'Imagem Pollinations salva no R2');
          return r2Url;
        } catch (r2Err) {
          log.warn({ err: r2Err.message }, 'Falha ao salvar no R2, retornando URL direta');
        }
      }

      // Sem R2, retorna a URL de request (funciona como CDN temporária)
      return url;
    } catch (err) {
      lastError = err;
      log.warn({ err: err.message, attempt }, 'Pollinations falhou, tentando novamente');
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }
  }

  throw new Error(`Pollinations falhou após ${MAX_RETRIES} tentativas: ${lastError?.message}`);
}

export { generateImagePollinations };
