import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import indexRouter from './routes/index.js';
import rpgRouter from './routes/rpg.js';
import historiaRouter from './routes/historia.js';
import sessaoRouter from './routes/sessao.js';
import temasRouter from './routes/temas.js';
import websocketRouter from './routes/websocket.js';
import vantagemRouter from './routes/vantagens.js';
import desvantagemRouter from './routes/desvantagens.js';
import personagemRouter from './routes/personagem.js';
import classeRouter from './routes/classe.js';
import racaRouter from './routes/raca.js';
import authRouter from './routes/auth.js';
import usuarioRouter from './routes/usuarios.js';

import { createExecutor } from './tools/master.js';
import specs from './swagger-config.js';

const app = express();

createExecutor()
// view engine setup
app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Role Chat Game API Documentation'
}));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/usuarios', usuarioRouter);
app.use('/rpg', rpgRouter);
app.use('/historias', historiaRouter);
app.use('/sessoes', sessaoRouter);
app.use('/temas', temasRouter);
app.use('/websocket', websocketRouter);
app.use('/vantagens', vantagemRouter);
app.use('/desvantagens', desvantagemRouter);
app.use('/personagem', personagemRouter);
app.use('/racas', racaRouter);
app.use('/classes', classeRouter);


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
