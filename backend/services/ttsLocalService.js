import fs from 'fs/promises';
import path from 'path';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'ttsLocalService' });

const LOCAL_DIR = process.env.TTS_LOCAL_DIR || '/tmp/lunaria-tts';
const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

let cleanupScheduled = false;

async function ensureDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

/**
 * Salva buffer de áudio no disco local (staging antes do R2).
 * @param {string} cacheKey - SHA256 que identifica o áudio
 * @param {Buffer} buffer
 * @param {string} ext - extensão do arquivo ('wav' ou 'mp3')
 * @returns {Promise<string>} Caminho absoluto do arquivo salvo
 */
async function save(cacheKey, buffer, ext = 'wav') {
  await ensureDir();
  const filePath = path.join(LOCAL_DIR, `${cacheKey}.${ext}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Apaga um arquivo local de staging (após upload bem-sucedido ao R2).
 * @param {string} filePath
 */
async function remove(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // Arquivo já removido — OK
  }
}

/**
 * Remove arquivos de staging mais velhos que 24h.
 * Executar via cron (uma vez por dia).
 */
async function cleanup() {
  try {
    await ensureDir();
    const files = await fs.readdir(LOCAL_DIR);
    const now = Date.now();
    let removed = 0;

    await Promise.all(files.map(async (file) => {
      const filePath = path.join(LOCAL_DIR, file);
      try {
        const stat = await fs.stat(filePath);
        if (now - stat.mtimeMs > CLEANUP_MAX_AGE_MS) {
          await fs.unlink(filePath);
          removed++;
        }
      } catch {
        // Ignorar erros de arquivo individual
      }
    }));

    log.info({ removed, total: files.length }, 'Cleanup concluido');
    return removed;
  } catch (err) {
    log.error({ err }, 'Cleanup error');
    return 0;
  }
}

/**
 * Agenda cleanup uma vez por dia.
 * Chamar uma vez na inicialização do servidor.
 */
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  const runCleanup = () => {
    cleanup().catch((err) => log.error({ err }, 'Scheduled cleanup error'));
    setTimeout(runCleanup, CLEANUP_MAX_AGE_MS).unref();
  };

  // Primeira execução após 1 hora (não logo na inicialização)
  setTimeout(runCleanup, 60 * 60 * 1000).unref();
}

export default { save, remove, cleanup, scheduleCleanup };
