import { Router } from 'express';

import {
  createFollowRequest,
  acceptFollowRequest,
  declineFollowRequest,
  cancelFollowRequest,
  removeFollow,
  getFollowing,
  getFollowers,
  getPendingFollowRequests,
} from '../controllers/follow.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validateParams } from '../middleware/validate.js';

import { recipientIdParamsSchema, followIdParamsSchema } from '../schemas/follow.schema.js';

const router = Router();

router.post(
  '/users/:recipientId/follow',
  authenticate,
  validateParams(recipientIdParamsSchema),
  createFollowRequest,
);

router.get('/users/me/following', authenticate, getFollowing);

router.get('/users/me/followers', authenticate, getFollowers);

router.get('/users/me/follow-requests', authenticate, getPendingFollowRequests);

router.patch(
  '/follows/:followId/accept',
  authenticate,
  validateParams(followIdParamsSchema),
  acceptFollowRequest,
);

router.patch(
  '/follows/:followId/decline',
  authenticate,
  validateParams(followIdParamsSchema),
  declineFollowRequest,
);

router.delete(
  '/follows/:followId/request',
  authenticate,
  validateParams(followIdParamsSchema),
  cancelFollowRequest,
);

router.delete(
  '/follows/:followId',
  authenticate,
  validateParams(followIdParamsSchema),
  removeFollow,
);

export default router;
