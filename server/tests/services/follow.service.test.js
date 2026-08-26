import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';

import {
  acceptFollowRequest,
  cancelFollowRequest,
  createFollowRequest,
  declineFollowRequest,
  findFollowers,
  findFollowing,
  findPendingFollowRequests,
  removeFollow,
} from '../../src/services/follow.service.js';

describe('follow service', () => {
  let requester;
  let recipient;
  let thirdUser;

  beforeEach(async () => {
    requester = await prisma.user.create({
      data: {
        username: 'requester',
        email: 'requester@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    recipient = await prisma.user.create({
      data: {
        username: 'recipient',
        email: 'recipient@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    thirdUser = await prisma.user.create({
      data: {
        username: 'thirduser',
        email: 'thirduser@example.com',
        emailVerifiedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createFollowRequest', () => {
    it('creates a pending follow request', async () => {
      const follow = await createFollowRequest({
        requesterId: requester.id,
        recipientId: recipient.id,
      });

      expect(follow).toMatchObject({
        id: expect.any(String),
        requesterId: requester.id,
        recipientId: recipient.id,
        status: 'PENDING',
        requester: {
          id: requester.id,
          username: requester.username,
        },
        recipient: {
          id: recipient.id,
          username: recipient.username,
        },
      });

      expect(follow.createdAt).toBeInstanceOf(Date);
      expect(follow.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects sending a follow request to yourself', async () => {
      await expect(
        createFollowRequest({
          requesterId: requester.id,
          recipientId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'SELF_FOLLOW_NOT_ALLOWED',
      });
    });

    it('rejects a nonexistent requester', async () => {
      await expect(
        createFollowRequest({
          requesterId: '00000000-0000-0000-0000-000000000000',
          recipientId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('rejects a nonexistent recipient', async () => {
      await expect(
        createFollowRequest({
          requesterId: requester.id,
          recipientId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('rejects a duplicate pending request', async () => {
      await createFollowRequest({
        requesterId: requester.id,
        recipientId: recipient.id,
      });

      await expect(
        createFollowRequest({
          requesterId: requester.id,
          recipientId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_ALREADY_PENDING',
      });
    });

    it('rejects a request when the users are already following', async () => {
      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await expect(
        createFollowRequest({
          requesterId: requester.id,
          recipientId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ALREADY_FOLLOWING',
      });
    });

    it('rejects a request when a declined relationship already exists', async () => {
      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'DECLINED',
        },
      });

      await expect(
        createFollowRequest({
          requesterId: requester.id,
          recipientId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_ALREADY_EXISTS',
      });
    });
  });

  describe('acceptFollowRequest', () => {
    it('accepts a pending follow request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const result = await acceptFollowRequest({
        followId: follow.id,
        userId: recipient.id,
      });

      expect(result.status).toBe('ACCEPTED');
      expect(result.requester.id).toBe(requester.id);
      expect(result.recipient.id).toBe(recipient.id);
    });

    it('rejects accepting a nonexistent request', async () => {
      await expect(
        acceptFollowRequest({
          followId: '00000000-0000-0000-0000-000000000000',
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'FOLLOW_NOT_FOUND',
      });
    });

    it('prevents the requester from accepting their own request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await expect(
        acceptFollowRequest({
          followId: follow.id,
          userId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FOLLOW_ACCEPT_FORBIDDEN',
      });
    });

    it('prevents another user from accepting the request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await expect(
        acceptFollowRequest({
          followId: follow.id,
          userId: thirdUser.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FOLLOW_ACCEPT_FORBIDDEN',
      });
    });

    it('rejects accepting an already accepted relationship', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await expect(
        acceptFollowRequest({
          followId: follow.id,
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_NOT_PENDING',
      });
    });

    it('rejects accepting a declined request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'DECLINED',
        },
      });

      await expect(
        acceptFollowRequest({
          followId: follow.id,
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_NOT_PENDING',
      });
    });
  });

  describe('declineFollowRequest', () => {
    it('declines a pending follow request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const result = await declineFollowRequest({
        followId: follow.id,
        userId: recipient.id,
      });

      expect(result.status).toBe('DECLINED');

      const storedFollow = await prisma.follow.findUnique({
        where: {
          id: follow.id,
        },
      });

      expect(storedFollow.status).toBe('DECLINED');
    });

    it('prevents the requester from declining their own request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await expect(
        declineFollowRequest({
          followId: follow.id,
          userId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FOLLOW_DECLINE_FORBIDDEN',
      });
    });

    it('rejects declining a nonexistent request', async () => {
      await expect(
        declineFollowRequest({
          followId: '00000000-0000-0000-0000-000000000000',
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'FOLLOW_NOT_FOUND',
      });
    });

    it('rejects declining an already accepted relationship', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await expect(
        declineFollowRequest({
          followId: follow.id,
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_NOT_PENDING',
      });
    });
  });

  describe('cancelFollowRequest', () => {
    it('cancels a pending request created by the user', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await cancelFollowRequest({
        followId: follow.id,
        userId: requester.id,
      });

      const deletedFollow = await prisma.follow.findUnique({
        where: {
          id: follow.id,
        },
      });

      expect(deletedFollow).toBeNull();
    });

    it('prevents the recipient from cancelling the request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await expect(
        cancelFollowRequest({
          followId: follow.id,
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FOLLOW_CANCEL_FORBIDDEN',
      });
    });

    it('rejects cancelling an accepted relationship', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await expect(
        cancelFollowRequest({
          followId: follow.id,
          userId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_REQUEST_NOT_PENDING',
      });
    });
  });

  describe('removeFollow', () => {
    it('removes an accepted follow relationship', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await removeFollow({
        followId: follow.id,
        userId: requester.id,
      });

      const deletedFollow = await prisma.follow.findUnique({
        where: {
          id: follow.id,
        },
      });

      expect(deletedFollow).toBeNull();
    });

    it('prevents the recipient from removing the relationship', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await expect(
        removeFollow({
          followId: follow.id,
          userId: recipient.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FOLLOW_REMOVE_FORBIDDEN',
      });
    });

    it('rejects removing a pending request', async () => {
      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      await expect(
        removeFollow({
          followId: follow.id,
          userId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'FOLLOW_NOT_ACCEPTED',
      });
    });

    it('rejects removing a nonexistent relationship', async () => {
      await expect(
        removeFollow({
          followId: '00000000-0000-0000-0000-000000000000',
          userId: requester.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'FOLLOW_NOT_FOUND',
      });
    });
  });

  describe('findFollowing', () => {
    it('returns accepted users the user is following', async () => {
      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: thirdUser.id,
          status: 'PENDING',
        },
      });

      const result = await findFollowing({
        userId: requester.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        recipient: {
          id: recipient.id,
          username: recipient.username,
        },
      });
    });

    it('returns an empty list when the user follows nobody', async () => {
      const result = await findFollowing({
        userId: requester.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects a nonexistent user', async () => {
      await expect(
        findFollowing({
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findFollowers', () => {
    it('returns accepted users who follow the user', async () => {
      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      await prisma.follow.create({
        data: {
          requesterId: thirdUser.id,
          recipientId: recipient.id,
          status: 'PENDING',
        },
      });

      const result = await findFollowers({
        userId: recipient.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        requester: {
          id: requester.id,
          username: requester.username,
        },
      });
    });

    it('returns an empty list when the user has no followers', async () => {
      const result = await findFollowers({
        userId: recipient.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects a nonexistent user', async () => {
      await expect(
        findFollowers({
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findPendingFollowRequests', () => {
    it('returns pending requests received by the user', async () => {
      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'PENDING',
        },
      });

      await prisma.follow.create({
        data: {
          requesterId: thirdUser.id,
          recipientId: recipient.id,
          status: 'DECLINED',
        },
      });

      const result = await findPendingFollowRequests({
        userId: recipient.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        requester: {
          id: requester.id,
          username: requester.username,
        },
      });
    });

    it('returns an empty list when there are no pending requests', async () => {
      const result = await findPendingFollowRequests({
        userId: recipient.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects a nonexistent user', async () => {
      await expect(
        findPendingFollowRequests({
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });
});
