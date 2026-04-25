import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import router from './routes/index.js';
import {
  corsMiddleware,
  globalRateLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';

export const app: Express = express();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined'));

app.use(globalRateLimiter);

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

export const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`API available at http://localhost:${config.server.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;