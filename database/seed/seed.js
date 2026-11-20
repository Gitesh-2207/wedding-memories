import { runSeed } from '../../backend/src/scripts/seed.js';

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during database setup:', err);
    process.exit(1);
  });
