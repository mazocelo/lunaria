import { GoogleGenAI } from '@google/genai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'nanoBananaService' });

const MODEL = process.env.NANO_BANANA_MODEL || 'gemini-3.1-flash-image-preview';
const API_KEY = process.env.GOOGLE_API_KEY;
const TIMEOUT_MS = 120_000;
const MAX_RETRIES = 2;

// R2 bucket dedicado para imagens
const R2_IMAGES_BUCKET = process.env.R2_IMAGES_BUCKET || 'lunaria-images';
const R2_IMAGES_PUBLIC_URL = process.env.R2_IMAGES_PUBLIC_URL || null;

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId || !R2_IMAGES_PUBLIC_URL) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadToR2(key, buffer, contentType) {
  const client = getR2Client();
  if (!client) return null;
  await client.send(new PutObjectCommand({
    Bucket: R2_IMAGES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));
  return `${R2_IMAGES_PUBLIC_URL}/${key}`;
}

/**
 * Gera imagem via Nano Banana 2 (Gemini 3.1 Flash Image).
 * Retorna base64 → upload para R2 → URL permanente.
 * Se R2 não configurado, retorna data URI.
 */
async function generateImageNanoBanana(prompt, options = {}) {
  if (!API_KEY) {
    throw new Error('GOOGLE_API_KEY não configurada para Nano Banana');
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const config = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: options.aspectRatio || '1:1',
      imageSize: options.imageSize || '1K',
    },
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log.info({ attempt, model: MODEL, promptLength: prompt.length }, 'Gerando imagem via Nano Banana 2');

      const response = await Promise.race([
        ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NANO_BANANA_TIMEOUT')), TIMEOUT_MS)),
      ]);

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('Nano Banana retornou resposta vazia');
      }

      // Encontra a parte com imagem
      const imagePart = parts.find(p => p.inlineData);
      if (!imagePart) {
        const textPart = parts.find(p => p.text);
        throw new Error(`Nano Banana não gerou imagem. Texto: ${textPart?.text?.slice(0, 200) || 'nenhum'}`);
      }

      const { data: base64Data, mimeType } = imagePart.inlineData;
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType?.includes('png') ? 'png' : 'jpg';

      log.info({ size: buffer.length, mimeType }, 'Imagem gerada via Nano Banana 2');

      // Upload para R2 images bucket
      try {
        const key = `${options.entityType || 'misc'}/${options.entityId || Date.now()}-${Date.now()}.${ext}`;
        const r2Url = await uploadToR2(key, buffer, mimeType || `image/${ext}`);
        if (r2Url) {
          log.info({ key }, 'Imagem Nano Banana salva no R2');
          return r2Url;
        }
      } catch (r2Err) {
        log.warn({ err: r2Err.message }, 'Falha ao salvar no R2, retornando data URI');
      }

      // Fallback: data URI
      return `data:${mimeType || 'image/png'};base64,${base64Data}`;
    } catch (err) {
      lastError = err;
      log.warn({ err: err.message, attempt }, 'Nano Banana falhou');

      if (attempt < MAX_RETRIES) {
        // Rate limit: espera mais
        const delay = /429|quota|rate/i.test(err.message) ? 30000 : 5000;
        await new Promise(r => setTimeout(r, delay * attempt));
      }
    }
  }

  throw new Error(`Nano Banana falhou após ${MAX_RETRIES} tentativas: ${lastError?.message}`);
}

export { generateImageNanoBanana };
