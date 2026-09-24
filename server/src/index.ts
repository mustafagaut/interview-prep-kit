import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import kitRoutes from './routes/Kit.js';

export const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
});
app.use('/api/kits', kitRoutes);
app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(error);
  const status = error instanceof mongoose.Error.ValidationError ? 400 : 500;
  const message = status === 400 ? 'Request validation failed' : 'Internal server error';
  console.error(error);
  res.status(status).json({ error: message });
});

export async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(mongoUri);
  const server = app.listen(port, () => console.log(`Interview kit API listening on port ${port}`));
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}; shutting down`);
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer().catch(error => {
    console.error('Unable to start API', error);
    process.exitCode = 1;
  });
}