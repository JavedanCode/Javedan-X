import bcrypt from 'bcryptjs';
import request from 'supertest';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resetRateLimiters } from '../../src/middleware/rate-limit.js';

import { prisma } from '../../src/db/prisma.js';
import app from '../../src/app.js';

describe('Post API', () => {
  let user;
  let secondUser;
  let userPassword;
  let userAgent;

  beforeEach(async () => {
    await resetRateLimiters();
    userPassword = 'StrongPassword123!';
    userAgent = 'Post-Test-Agent';

    const passwordHash = await bcrypt.hash(userPassword, 12);

    user = await prisma.user.create({
      data: {
        username: 'postapiuser',
        email: 'postapi@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'postapiuser2',
        email: 'postapi2@example.com',
        emailVerifiedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  async function loginUser() {
    const response = await request(app).post('/auth/login').set('User-Agent', userAgent).send({
      email: user.email,
      password: userPassword,
    });

    expect(response.status).toBe(200);

    return response.headers['set-cookie'];
  }

  describe('POST /posts', () => {
    it('creates a post', async () => {
      const cookies = await loginUser();

      const response = await request(app).post('/posts').set('Cookie', cookies).send({
        content: 'Hello from my new post.',
      });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Post created successfully.',
        post: {
          id: expect.any(String),
          authorId: user.id,
          content: 'Hello from my new post.',
          imageUrl: null,
          likeCount: 0,
          likedByCurrentUser: false,
          author: {
            id: user.id,
            username: user.username,
          },
          comments: [],
        },
      });

      const post = await prisma.post.findUnique({
        where: {
          id: response.body.post.id,
        },
      });

      expect(post).not.toBeNull();
      expect(post.authorId).toBe(user.id);
    });

    it('creates a post with an image URL', async () => {
      const cookies = await loginUser();

      const response = await request(app).post('/posts').set('Cookie', cookies).send({
        content: 'Post with image.',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(response.status).toBe(201);
      expect(response.body.post.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('rejects unauthenticated requests', async () => {
      const response = await request(app).post('/posts').send({
        content: 'Unauthenticated post.',
      });

      expect(response.status).toBe(401);
    });

    it('rejects invalid post content', async () => {
      const cookies = await loginUser();

      const response = await request(app).post('/posts').set('Cookie', cookies).send({
        content: '',
      });

      expect(response.status).toBe(400);
    });

    it('rejects a post with content exceeding the maximum length', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .post('/posts')
        .set('Cookie', cookies)
        .send({
          content: 'a'.repeat(5001),
        });

      expect(response.status).toBe(400);
    });

    it('rejects an invalid image URL', async () => {
      const cookies = await loginUser();

      const response = await request(app).post('/posts').set('Cookie', cookies).send({
        content: 'Invalid image URL.',
        imageUrl: 'not-a-url',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /posts/:postId', () => {
    it('returns a post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post to retrieve.',
        },
      });

      const response = await request(app).get(`/posts/${post.id}`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        post: {
          id: post.id,
          authorId: secondUser.id,
          content: 'Post to retrieve.',
          likeCount: 0,
          likedByCurrentUser: false,
        },
      });
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).get('/posts/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('returns 404 for a nonexistent post', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .get('/posts/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects unauthenticated requests', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Protected post.',
        },
      });

      const response = await request(app).get(`/posts/${post.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/:userId/posts', () => {
    it('returns posts belonging to the requested user', async () => {
      const cookies = await loginUser();

      await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'First post.',
        },
      });

      await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Second post.',
        },
      });

      const response = await request(app)
        .get(`/users/${secondUser.id}/posts`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.posts).toHaveLength(2);

      expect(response.body.posts.every((post) => post.authorId === secondUser.id)).toBe(true);
    });

    it('returns an empty list when the user has no posts', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .get(`/users/${secondUser.id}/posts`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        posts: [],
      });
    });

    it('returns 404 for a nonexistent user', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .get('/users/00000000-0000-0000-0000-000000000000/posts')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid user ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).get('/users/not-a-uuid/posts').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /posts/feed', () => {
    it('returns the current user posts', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'My feed post.',
        },
      });

      const response = await request(app).get('/posts/feed').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].id).toBe(post.id);
    });

    it('returns posts from accepted follows', async () => {
      const cookies = await loginUser();

      await prisma.follow.create({
        data: {
          requesterId: user.id,
          recipientId: secondUser.id,
          status: 'ACCEPTED',
        },
      });

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Followed user post.',
        },
      });

      const response = await request(app).get('/posts/feed').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].id).toBe(post.id);
    });

    it('does not return posts from pending follows', async () => {
      const cookies = await loginUser();

      await prisma.follow.create({
        data: {
          requesterId: user.id,
          recipientId: secondUser.id,
          status: 'PENDING',
        },
      });

      await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Pending follow post.',
        },
      });

      const response = await request(app).get('/posts/feed').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(0);
    });

    it('does not return posts from declined follows', async () => {
      const cookies = await loginUser();

      await prisma.follow.create({
        data: {
          requesterId: user.id,
          recipientId: secondUser.id,
          status: 'DECLINED',
        },
      });

      await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Declined follow post.',
        },
      });

      const response = await request(app).get('/posts/feed').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(0);
    });

    it('rejects unauthenticated requests', async () => {
      const response = await request(app).get('/posts/feed');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /posts/:postId', () => {
    it('updates an owned post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Original content.',
        },
      });

      const response = await request(app).patch(`/posts/${post.id}`).set('Cookie', cookies).send({
        content: 'Updated content.',
      });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Post updated successfully.',
        post: {
          id: post.id,
          content: 'Updated content.',
        },
      });
    });

    it('removes the image when imageUrl is null', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post with image.',
          imageUrl: 'https://example.com/image.jpg',
        },
      });

      const response = await request(app).patch(`/posts/${post.id}`).set('Cookie', cookies).send({
        imageUrl: null,
      });

      expect(response.status).toBe(200);
      expect(response.body.post.imageUrl).toBeNull();
    });

    it('rejects an empty update', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Original content.',
        },
      });

      const response = await request(app)
        .patch(`/posts/${post.id}`)
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);
    });

    it('rejects updating another user post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Protected content.',
        },
      });

      const response = await request(app).patch(`/posts/${post.id}`).set('Cookie', cookies).send({
        content: 'Unauthorized update.',
      });

      expect(response.status).toBe(403);
    });

    it('returns 404 for a nonexistent post', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .patch('/posts/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .send({
          content: 'Update.',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /posts/:postId', () => {
    it('deletes an owned post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post to delete.',
        },
      });

      const response = await request(app).delete(`/posts/${post.id}`).set('Cookie', cookies);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const deletedPost = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });

      expect(deletedPost).toBeNull();
    });

    it('rejects deleting another user post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Protected post.',
        },
      });

      const response = await request(app).delete(`/posts/${post.id}`).set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('returns 404 for a nonexistent post', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .delete('/posts/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).delete('/posts/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });
  });
});
