import { Router } from 'express';

import {
  createComment,
  getCommentById,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validate, validateParams } from '../middleware/validate.js';

import {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamsSchema,
} from '../schemas/comment.schema.js';

import { postIdParamsSchema } from '../schemas/post.schema.js';

const router = Router();

router.post(
  '/posts/:postId/comments',
  authenticate,
  validateParams(postIdParamsSchema),
  validate(createCommentSchema),
  createComment,
);

router.get(
  '/posts/:postId/comments',
  authenticate,
  validateParams(postIdParamsSchema),
  getCommentsByPost,
);

router.get(
  '/comments/:commentId',
  authenticate,
  validateParams(commentIdParamsSchema),
  getCommentById,
);

router.patch(
  '/comments/:commentId',
  authenticate,
  validateParams(commentIdParamsSchema),
  validate(updateCommentSchema),
  updateComment,
);

router.delete(
  '/comments/:commentId',
  authenticate,
  validateParams(commentIdParamsSchema),
  deleteComment,
);

export default router;
