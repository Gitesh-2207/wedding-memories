import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { connectDatabase } from './config/db.js';
import { getR2Client } from './config/r2.js';
import { runSeed } from './scripts/seed.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('👑 Initializing Royal Wedding Memories Backend...');

    // 1. Connect to Database (Atlas or local in-memory fallback)
    await connectDatabase();

    // 2. Automatically ensure initial wedding & admin account exist
    await runSeed();

    // 3. Initialize Cloudflare R2 / Storage Provider
    getR2Client();

    // 4. Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`✨ Royal Wedding Memories Server running on port ${PORT}`);
      console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
