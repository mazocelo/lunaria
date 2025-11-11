import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import indexRouter from './routes/index.js';

import { createExecutor } from './tools/master.js';
import specs from './swagger-config.js';

const app = express();

createExecutor()

// Configuração CORS - Detecta automaticamente dev/prod
const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: isProduction 
    ? process.env.FRONTEND_URL || 'https://lunaria-backend-3754d2d676ff.herokuapp.com'
    : true, // Em dev, permite todas as origens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

console.log('🌐 CORS configurado:', {
  environment: isProduction ? 'production' : 'development',
  origin: corsOptions.origin,
  credentials: corsOptions.credentials
});

// view engine setup
app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(express.json());
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
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
