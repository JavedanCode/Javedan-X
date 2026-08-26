import { Router } from 'express';

import {
  createLike,
  deleteLike,
  getLikeById,
  getCurrentUserLike,
  getLikesByPost,
  getLikesByUser,
} from '../controllers/like.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validateParams } from '../middleware/validate.js';

import {
  likeIdParamsSchema,
  likePostParamsSchema,
  likeUserParamsSchema,
} from '../schemas/like.schema.js';

const router = Router();

router.post('/posts/:postId/likes', authenticate, validateParams(likePostParamsSchema), createLike);

router.delete(
  '/posts/:postId/likes',
  authenticate,
  validateParams(likePostParamsSchema),
  deleteLike,
);

router.get(
  '/posts/:postId/likes',
  authenticate,
  validateParams(likePostParamsSchema),
  getLikesByPost,
);

router.get(
  '/posts/:postId/likes/me',
  authenticate,
  validateParams(likePostParamsSchema),
  getCurrentUserLike,
);

router.get(
  '/users/:userId/likes',
  authenticate,
  validateParams(likeUserParamsSchema),
  getLikesByUser,
);

router.get('/likes/:likeId', authenticate, validateParams(likeIdParamsSchema), getLikeById);

export default router;
