import { Router } from 'express';
import * as notion from '../services/notion.js';

const router = Router();

// GET /digest/daily
router.get('/daily', async (req, res) => {
  try {
    const digest = await notion.buildDailyDigest();
    res.json(digest);
  } catch (err) {
    console.error('GET /digest/daily error:', err);
    res.status(500).json({ error: 'Failed to build daily digest' });
  }
});

// GET /digest/weekly
router.get('/weekly', async (req, res) => {
  try {
    const digest = await notion.buildWeeklyDigest();
    res.json(digest);
  } catch (err) {
    console.error('GET /digest/weekly error:', err);
    res.status(500).json({ error: 'Failed to build weekly digest' });
  }
});

export default router;
