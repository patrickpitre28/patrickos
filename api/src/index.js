import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import digestRouter from './routes/digest.js';

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

// Auth middleware
app.use('/api/v1', (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== process.env.AGENT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/digest', digestRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`PatrickOS API running on port ${PORT}`);
});
