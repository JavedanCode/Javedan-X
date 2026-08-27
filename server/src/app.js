import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import passport from 'passport';

import { configurePassport } from './config/passport.js';

import authRoutes from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
import commentRouter from './routes/comment.routes.js';
import followRouter from './routes/follow.routes.js';
import likeRouter from './routes/like.routes.js';

import { errorHandler } from './middleware/error-handler.js';
import { env } from './config/env.js';

const app = express();

// Security headers.
app.use(helmet());

// Credentialed requests from the configured frontend.
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(compression());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

configurePassport();
app.use(passport.initialize());

// Authentication.
app.use('/auth', authRoutes);

// Users.
app.use('/users', userRouter);

// Posts.
app.use('/posts', postRouter);

// Comments.
app.use('/', commentRouter);

// Follows.
app.use('/follows', followRouter);

// Likes.
app.use('/', likeRouter);

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is running.',
  });
});

// Error handler must be registered last.
app.use(errorHandler);

export default app;
