import { detectProvider } from '../Mestre/config.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'reviewer-config' });

const modelName = process.env.REVIEWER_MODEL || 'gemini-2.5-flash-lite';

export const REVIEWER_CONFIG = {
  enabled: process.env.REVIEWER_ENABLED !== 'false',
  model: {
    name: modelName,
    provider: detectProvider(modelName),
    temperature: 0.1,
    maxTokens: 1000,
    timeout: parseInt(process.env.REVIEWER_TIMEOUT_MS) || 8000,
  },
  failOpen: true,
};

if (REVIEWER_CONFIG.enabled) {
  log.info({ model: modelName, provider: REVIEWER_CONFIG.model.provider }, 'Revisores habilitados');
}

export default REVIEWER_CONFIG;
