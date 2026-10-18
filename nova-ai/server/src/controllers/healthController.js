import { getDb } from '../db/database.js';
import { getProvider, getAvailableModels } from '../services/aiProvider.js';

/**
 * Health check — reports server & DB status without exposing secrets.
 */
export function healthCheck(req, res) {
  let dbStatus = 'ok';
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'error';
  }

  const provider = getProvider();
  const aiStatus = provider.getStatus();
  // Never expose API key
  delete aiStatus.apiKey;

  res.json({
    status: dbStatus === 'ok' && aiStatus.ready ? 'ok' : 'degraded',
    database: dbStatus,
    ai: aiStatus,
    models: getAvailableModels(),
    timestamp: new Date().toISOString(),
  });
}
