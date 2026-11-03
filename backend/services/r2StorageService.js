import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || null;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || null;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || null;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lunaria-tts';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || null; // ex: https://pub-xxx.r2.dev

function isConfigured() {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);
}

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Faz upload de um Buffer para o R2 e retorna a URL pública.
 * @param {string} key - Nome do arquivo no bucket (ex: "abc123.wav")
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} contentType - MIME type (ex: "audio/wav")
 * @returns {Promise<string>} URL pública do arquivo
 */
async function upload(key, buffer, contentType = 'audio/wav') {
  if (!isConfigured()) {
    throw new Error('R2 não configurado (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL)');
  }

  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 ano — áudios são imutáveis
  }));

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Busca áudio do R2 e retorna como Buffer.
 * @param {string} url - URL pública do arquivo
 * @returns {Promise<Buffer>}
 */
async function fetchAudio(url) {
  if (!isConfigured()) {
    throw new Error('R2 não configurado');
  }

  // Extrai a key da URL pública
  const key = url.replace(`${R2_PUBLIC_URL}/`, '');
  const client = getClient();
  const response = await client.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default { isConfigured, upload, fetchAudio };
