import { Router } from 'express';

import {
  createPost,
  getPostById,
  getFeed,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validate, validateParams } from '../middleware/validate.js';

import { createPostSchema, updatePostSchema, postIdParamsSchema } from '../schemas/post.schema.js';

const router = Router();

router.post('/', authenticate, validate(createPostSchema), createPost);

router.get('/feed', authenticate, getFeed);

router.get('/:postId', authenticate, validateParams(postIdParamsSchema), getPostById);

router.patch(
  '/:postId',
  authenticate,
  validateParams(postIdParamsSchema),
  validate(updatePostSchema),
  updatePost,
);

router.delete('/:postId', authenticate, validateParams(postIdParamsSchema), deletePost);

export default router;
