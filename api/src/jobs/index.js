import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });
import cron from 'node-cron';
import { run as dailyDigest } from './dailyDigest.js';
import { run as overdueAlert } from './overdueAlert.js';
import { run as weeklyReport } from './weeklyReport.js';

console.log('PatrickOS Accountability Engine starting...');

// Daily Digest — 8AM CST (2PM UTC)
cron.schedule('0 14 * * *', async () => {
  try {
    await dailyDigest();
  } catch (err) {
    console.error('[dailyDigest] FAILED:', err);
  }
}, { timezone: 'UTC' });
console.log('  ✓ dailyDigest scheduled: 0 14 * * * UTC (8AM CST)');

// Overdue Alert — every 4 hours
cron.schedule('0 */4 * * *', async () => {
  try {
    await overdueAlert();
  } catch (err) {
    console.error('[overdueAlert] FAILED:', err);
  }
}, { timezone: 'UTC' });
console.log('  ✓ overdueAlert scheduled: 0 */4 * * * UTC');

// Weekly Report — Friday 3PM CST (9PM UTC)
cron.schedule('0 21 * * 5', async () => {
  try {
    await weeklyReport();
  } catch (err) {
    console.error('[weeklyReport] FAILED:', err);
  }
}, { timezone: 'UTC' });
console.log('  ✓ weeklyReport scheduled: 0 21 * * 5 UTC (Friday 3PM CST)');

console.log('Accountability Engine running. Waiting for scheduled jobs...');
