import app from './app.js';
import config from './config/index.js';
import { getDb, closeDb } from './db/database.js';
import { getProvider } from './services/aiProvider.js';

// Initialize database on startup
try {
  getDb();
  console.log('✓ Database initialized');
} catch (err) {
  console.error('✗ Database initialization failed:', err.message);
  process.exit(1);
}

// Initialize AI provider
const provider = getProvider();
if (provider.isReady()) {
  console.log(`✓ AI Provider: ${provider.name} (${provider.model})`);
} else {
  console.warn(`⚠ AI Provider not ready: ${provider.initError}`);
  console.warn('  The server will start but chat will not work until configured.');
}

// Start server
const server = app.listen(config.port, () => {
  console.log(`\n🚀 Aryx AI Server running on http://localhost:${config.port}`);
  console.log(`   Frontend origin: ${config.frontendOrigin}\n`);
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  server.close(() => {
    closeDb();
    console.log('Server closed.');
    process.exit(0);
  });
  // Force close after 5s
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
