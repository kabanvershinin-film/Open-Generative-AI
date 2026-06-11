
// Test pricing logic
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock environment variables
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.CNY_TO_RUB = '10.55';
process.env.PLATFORM_MARKUP = '1.15';

// Import pricing functions
const { priceRub } = require('./app/api/_lib/pricing.js');

async function test() {
  console.log('Testing priceRub...');
  const cost = await priceRub('video', 'doubao-seedance-2-0-260128', {
    duration: 5,
    resolution: '720p',
    video_url: undefined,
    generate_audio: false
  });
  console.log('Calculated cost:', cost);
}

test().catch(console.error);
