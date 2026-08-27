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
  getPendingSentFollowRequests,
} from '../controllers/follow.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validateParams } from '../middleware/validate.js';

import { recipientIdParamsSchema, followIdParamsSchema } from '../schemas/follow.schema.js';

const router = Router();

// Send a follow request.
router.post(
  '/users/:recipientId/follow',
  authenticate,
  validateParams(recipientIdParamsSchema),
  createFollowRequest,
);

// Current user's accepted relationships.
router.get('/users/me/following', authenticate, getFollowing);

router.get('/users/me/followers', authenticate, getFollowers);

// Follow requests received by the current user.
router.get('/users/me/follow-requests', authenticate, getPendingFollowRequests);

// Follow requests sent by the current user.
router.get('/users/me/follow-requests/sent', authenticate, getPendingSentFollowRequests);

// Accept a received follow request.
router.patch(
  '/:followId/accept',
  authenticate,
  validateParams(followIdParamsSchema),
  acceptFollowRequest,
);

// Decline a received follow request.
router.patch(
  '/:followId/decline',
  authenticate,
  validateParams(followIdParamsSchema),
  declineFollowRequest,
);

// Cancel a pending request sent by the current user.
router.delete(
  '/:followId/request',
  authenticate,
  validateParams(followIdParamsSchema),
  cancelFollowRequest,
);

// Remove an accepted relationship.
router.delete('/:followId', authenticate, validateParams(followIdParamsSchema), removeFollow);

export default router;
