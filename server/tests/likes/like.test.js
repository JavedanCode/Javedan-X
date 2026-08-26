import bcrypt from 'bcryptjs';
import request from 'supertest';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';

import app from '../../src/app.js';

import { resetRateLimiters } from '../../src/middleware/rate-limit.js';

describe('Like API', () => {
  let user;
  let secondUser;
  let post;
  let secondPost;

  const password = 'StrongPassword123!';

  beforeEach(async () => {
    await resetRateLimiters();
    const passwordHash = await bcrypt.hash(password, 12);

    user = await prisma.user.create({
      data: {
        username: 'likeapiuser',
        email: 'likeapiuser@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'secondlikeapiuser',
        email: 'secondlikeapiuser@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: 'Test post for likes.',
      },
    });

    secondPost = await prisma.post.create({
      data: {
        authorId: secondUser.id,
        content: 'Second test post for likes.',
      },
    });
  });

  afterEach(async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
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

  describe('POST /posts/:postId/likes', () => {
    it('likes a post', async () => {
      const cookies = await login(user.email);

      const response = await request(app).post(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Post liked successfully.',
        like: {
          id: expect.any(String),
          postId: post.id,
          userId: user.id,
          user: {
            id: user.id,
            username: user.username,
          },
        },
      });

      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: user.id,
          },
        },
      });

      expect(like).not.toBeNull();
    });

    it('rejects liking the same post twice', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const response = await request(app).post(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'LIKE_ALREADY_EXISTS',
        },
      });
    });

    it('returns 404 when the post does not exist', async () => {
      const cookies = await login(user.email);

      const response = await request(app)
        .post('/posts/00000000-0000-0000-000000000000/likes')
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await login(user.email);

      const response = await request(app).post('/posts/not-a-uuid/likes').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).post(`/posts/${post.id}/likes`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /posts/:postId/likes', () => {
    it('unlikes a post', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const response = await request(app).delete(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(204);

      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: user.id,
          },
        },
      });

      expect(like).toBeNull();
    });

    it('rejects unliking a post the user has not liked', async () => {
      const cookies = await login(user.email);

      const response = await request(app).delete(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'LIKE_NOT_FOUND',
        },
      });
    });

    it('cannot remove another users like', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: secondUser.id,
        },
      });

      const response = await request(app).delete(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(404);

      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: secondUser.id,
          },
        },
      });

      expect(like).not.toBeNull();
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).delete(`/posts/${post.id}/likes`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /posts/:postId/likes', () => {
    it('returns all users who liked a post', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: secondUser.id,
        },
      });

      const response = await request(app).get(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.likes).toHaveLength(2);

      expect(response.body.likes.map((like) => like.user.id)).toEqual(
        expect.arrayContaining([user.id, secondUser.id]),
      );
    });

    it('returns an empty list when nobody has liked the post', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get(`/posts/${post.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.likes).toEqual([]);
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get('/posts/not-a-uuid/likes').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get(`/posts/${post.id}/likes`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /posts/:postId/likes/me', () => {
    it('returns the current users like when the post is liked', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const response = await request(app).get(`/posts/${post.id}/likes/me`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        liked: true,
        like: {
          postId: post.id,
          userId: user.id,
        },
      });
    });

    it('returns liked false when the current user has not liked the post', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get(`/posts/${post.id}/likes/me`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        liked: false,
        like: null,
      });
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get('/posts/not-a-uuid/likes/me').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get(`/posts/${post.id}/likes/me`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/:userId/likes', () => {
    it('returns posts liked by the user', async () => {
      const cookies = await login(user.email);

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      await prisma.like.create({
        data: {
          postId: secondPost.id,
          userId: user.id,
        },
      });

      const response = await request(app).get(`/users/${user.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.likes).toHaveLength(2);

      expect(response.body.likes.map((like) => like.post.id)).toEqual(
        expect.arrayContaining([post.id, secondPost.id]),
      );
    });

    it('returns an empty list when the user has liked no posts', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get(`/users/${user.id}/likes`).set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.likes).toEqual([]);
    });

    it('returns 404 for a nonexistent user', async () => {
      const cookies = await login(user.email);

      const response = await request(app)
        .get('/users/00000000-0000-0000-0000-000000000000/likes')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid user ID', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get('/users/not-a-uuid/likes').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get(`/users/${user.id}/likes`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /likes/:likeId', () => {
    it('returns a like by ID', async () => {
      const cookies = await login(user.email);

      const like = await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const response = await request(app).get(`/likes/${like.id}`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        like: {
          id: like.id,
          postId: post.id,
          userId: user.id,
          user: {
            id: user.id,
            username: user.username,
          },
        },
      });
    });

    it('returns 404 for a nonexistent like', async () => {
      const cookies = await login(user.email);

      const response = await request(app)
        .get('/likes/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid like ID', async () => {
      const cookies = await login(user.email);

      const response = await request(app).get('/likes/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get('/likes/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(401);
    });
  });
});
