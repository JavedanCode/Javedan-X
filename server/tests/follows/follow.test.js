import bcrypt from 'bcryptjs';
import request from 'supertest';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';

import app from '../../src/app.js';

import { resetRateLimiters } from '../../src/middleware/rate-limit.js';

describe('Follow API', () => {
  let requester;
  let recipient;
  let thirdUser;

  const password = 'StrongPassword123!';

  beforeEach(async () => {
    await resetRateLimiters();
    const passwordHash = await bcrypt.hash(password, 12);

    requester = await prisma.user.create({
      data: {
        username: 'followrequester',
        email: 'followrequester@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    recipient = await prisma.user.create({
      data: {
        username: 'followrecipient',
        email: 'followrecipient@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    thirdUser = await prisma.user.create({
      data: {
        username: 'followthird',
        email: 'followthird@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  async function login(email) {
    const response = await request(app).post('/auth/login').send({
      email,
      password,
    });

    expect(response.status).toBe(200);

    return response.headers['set-cookie'];
  }

  describe('POST /users/:recipientId/follow', () => {
    it('sends a follow request', async () => {
      const cookies = await login(requester.email);

      const response = await request(app)
        .post(`/users/${recipient.id}/follow`)
        .set('Cookie', cookies);

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Follow request sent successfully.',
        follow: {
          id: expect.any(String),
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'PENDING',
        },
      });

      const follow = await prisma.follow.findUnique({
        where: {
          id: response.body.follow.id,
        },
      });

      expect(follow.status).toBe('PENDING');
    });

    it('rejects sending a request to yourself', async () => {
      const cookies = await login(requester.email);

      const response = await request(app)
        .post(`/users/${requester.id}/follow`)
        .set('Cookie', cookies);

      expect(response.status).toBe(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'SELF_FOLLOW_NOT_ALLOWED',
        },
      });
    });

    it('rejects a duplicate pending request', async () => {
      const cookies = await login(requester.email);

      await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .post(`/users/${recipient.id}/follow`)
        .set('Cookie', cookies);

      expect(response.status).toBe(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FOLLOW_REQUEST_ALREADY_PENDING',
        },
      });
    });

    it('rejects an invalid recipient ID', async () => {
      const cookies = await login(requester.email);

      const response = await request(app).post('/users/not-a-uuid/follow').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('returns 404 for a nonexistent recipient', async () => {
      const cookies = await login(requester.email);

      const response = await request(app)
        .post('/users/00000000-0000-0000-0000-000000000000/follow')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).post(`/users/${recipient.id}/follow`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/me/following', () => {
    it('returns the users the current user follows', async () => {
      const cookies = await login(requester.email);

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

      const response = await request(app).get('/users/me/following').set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
      });

      expect(response.body.follows).toHaveLength(1);
      expect(response.body.follows[0].recipient).toMatchObject({
        id: recipient.id,
        username: recipient.username,
      });
    });

    it('returns an empty list when the user follows nobody', async () => {
      const cookies = await login(requester.email);

      const response = await request(app).get('/users/me/following').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.follows).toEqual([]);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get('/users/me/following');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/me/followers', () => {
    it('returns the users who follow the current user', async () => {
      const cookies = await login(recipient.email);

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

      const response = await request(app).get('/users/me/followers').set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body.follows).toHaveLength(1);
      expect(response.body.follows[0].requester).toMatchObject({
        id: requester.id,
        username: requester.username,
      });
    });

    it('returns an empty list when the user has no followers', async () => {
      const cookies = await login(recipient.email);

      const response = await request(app).get('/users/me/followers').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.follows).toEqual([]);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get('/users/me/followers');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/me/follow-requests', () => {
    it('returns pending requests received by the current user', async () => {
      const cookies = await login(recipient.email);

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

      const response = await request(app).get('/users/me/follow-requests').set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body.follows).toHaveLength(1);
      expect(response.body.follows[0].requester).toMatchObject({
        id: requester.id,
        username: requester.username,
      });
    });

    it('returns an empty list when there are no pending requests', async () => {
      const cookies = await login(recipient.email);

      const response = await request(app).get('/users/me/follow-requests').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.follows).toEqual([]);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get('/users/me/follow-requests');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /follows/:followId/accept', () => {
    it('accepts a pending follow request', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/accept`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Follow request accepted successfully.',
        follow: {
          id: follow.id,
          status: 'ACCEPTED',
        },
      });
    });

    it('prevents the requester from accepting the request', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/accept`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('rejects accepting an already accepted relationship', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/accept`)
        .set('Cookie', cookies);

      expect(response.status).toBe(409);
    });

    it('rejects an invalid follow ID', async () => {
      const cookies = await login(recipient.email);

      const response = await request(app)
        .patch('/follows/not-a-uuid/accept')
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('returns 404 for a nonexistent follow', async () => {
      const cookies = await login(recipient.email);

      const response = await request(app)
        .patch('/follows/00000000-0000-0000-0000-000000000000/accept')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).patch(
        `/follows/00000000-0000-0000-0000-000000000000/accept`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /follows/:followId/decline', () => {
    it('declines a pending follow request', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/decline`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Follow request declined successfully.',
        follow: {
          id: follow.id,
          status: 'DECLINED',
        },
      });
    });

    it('prevents the requester from declining the request', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/decline`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('rejects declining an already accepted relationship', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app)
        .patch(`/follows/${follow.id}/decline`)
        .set('Cookie', cookies);

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /follows/:followId/request', () => {
    it('cancels a pending request', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .delete(`/follows/${follow.id}/request`)
        .set('Cookie', cookies);

      expect(response.status).toBe(204);

      const deletedFollow = await prisma.follow.findUnique({
        where: {
          id: follow.id,
        },
      });

      expect(deletedFollow).toBeNull();
    });

    it('prevents the recipient from cancelling the request', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app)
        .delete(`/follows/${follow.id}/request`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('rejects cancelling an accepted relationship', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app)
        .delete(`/follows/${follow.id}/request`)
        .set('Cookie', cookies);

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /follows/:followId', () => {
    it('removes an accepted follow relationship', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app).delete(`/follows/${follow.id}`).set('Cookie', cookies);

      expect(response.status).toBe(204);

      const deletedFollow = await prisma.follow.findUnique({
        where: {
          id: follow.id,
        },
      });

      expect(deletedFollow).toBeNull();
    });

    it('prevents the recipient from removing the relationship', async () => {
      const cookies = await login(recipient.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app).delete(`/follows/${follow.id}`).set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('rejects removing a pending request', async () => {
      const cookies = await login(requester.email);

      const follow = await prisma.follow.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
        },
      });

      const response = await request(app).delete(`/follows/${follow.id}`).set('Cookie', cookies);

      expect(response.status).toBe(409);
    });

    it('rejects an invalid follow ID', async () => {
      const cookies = await login(requester.email);

      const response = await request(app).delete('/follows/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).delete('/follows/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(401);
    });
  });
});
