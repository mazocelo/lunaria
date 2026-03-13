import 'dotenv/config';
import ttsCacheService from '../services/ttsCacheService.js';

const result = await ttsCacheService.pruneExpiredEntries({ force: true });
console.log(`[tts-cache] registros removidos: ${result.count || 0}`);
