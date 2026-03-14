import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import pinoLogger from './helpers/logger.js';

const log = pinoLogger.child({ module: 'app' });
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import indexRouter from './routes/index.js';

import specs from './swagger-config.js';

const app = express();

// Configuração CORS - Detecta automaticamente dev/prod
const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: isProduction
    ? process.env.FRONTEND_URL || false
    : true, // Em dev, permite todas as origens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

log.info({
  environment: isProduction ? 'production' : 'development',
  origin: corsOptions.origin,
  credentials: corsOptions.credentials
}, 'CORS configurado');

// Trust proxy (necessário para Heroku / reverse proxies)
if (isProduction) {
  app.set('trust proxy', 1);
}

// view engine setup
app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'jade');

app.use(helmet());
app.use(logger(isProduction ? 'combined' : 'dev'));
app.use(cors(corsOptions));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Role Chat Game API Documentation'
}));

app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Erro interno do servidor',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    }
  });
});

export default app;
