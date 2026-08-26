import bcrypt from 'bcryptjs';
import request from 'supertest';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';
import app from '../../src/app.js';

import { resetRateLimiters } from '../../src/middleware/rate-limit.js';

describe('Comment API', () => {
  let user;
  let secondUser;
  let userPassword;

  beforeEach(async () => {
    await resetRateLimiters();
    userPassword = 'StrongPassword123!';

    const passwordHash = await bcrypt.hash(userPassword, 12);

    user = await prisma.user.create({
      data: {
        username: 'commentapiuser',
        email: 'commentapi@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'commentapiuser2',
        email: 'commentapi2@example.com',
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
    const response = await request(app).post('/auth/login').send({
      email: user.email,
      password: userPassword,
    });

    expect(response.status).toBe(200);

    return response.headers['set-cookie'];
  }

  describe('POST /posts/:postId/comments', () => {
    it('creates a comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post to comment on.',
        },
      });

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', cookies)
        .send({
          content: 'This is my comment.',
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment created successfully.',
        comment: {
          id: expect.any(String),
          postId: post.id,
          authorId: user.id,
          content: 'This is my comment.',
          author: {
            id: user.id,
            username: user.username,
          },
        },
      });

      const comment = await prisma.comment.findUnique({
        where: {
          id: response.body.comment.id,
        },
      });

      expect(comment).not.toBeNull();
      expect(comment.authorId).toBe(user.id);
      expect(comment.postId).toBe(post.id);
    });

    it('rejects an unauthenticated request', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Protected post.',
        },
      });

      const response = await request(app).post(`/posts/${post.id}/comments`).send({
        content: 'Unauthenticated comment.',
      });

      expect(response.status).toBe(401);
    });

    it('rejects an empty comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', cookies)
        .send({
          content: '',
        });

      expect(response.status).toBe(400);
    });

    it('rejects a comment exceeding the maximum length', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Cookie', cookies)
        .send({
          content: 'a'.repeat(2001),
        });

      expect(response.status).toBe(400);
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .post('/posts/not-a-uuid/comments')
        .set('Cookie', cookies)
        .send({
          content: 'Comment.',
        });

      expect(response.status).toBe(400);
    });

    it('returns 404 when the post does not exist', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .post('/posts/00000000-0000-0000-0000-000000000000/comments')
        .set('Cookie', cookies)
        .send({
          content: 'Comment.',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /posts/:postId/comments', () => {
    it('returns all comments for a post', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post with comments.',
        },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'First comment.',
        },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Second comment.',
        },
      });

      const response = await request(app).get(`/posts/${post.id}/comments`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
      });

      expect(response.body.comments).toHaveLength(2);

      expect(response.body.comments[0]).toMatchObject({
        content: 'First comment.',
        author: {
          id: user.id,
          username: user.username,
        },
      });

      expect(response.body.comments[1]).toMatchObject({
        content: 'Second comment.',
        author: {
          id: secondUser.id,
          username: secondUser.username,
        },
      });
    });

    it('returns an empty list when the post has no comments', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post without comments.',
        },
      });

      const response = await request(app).get(`/posts/${post.id}/comments`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        comments: [],
      });
    });

    it('rejects an invalid post ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).get('/posts/not-a-uuid/comments').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('returns 404 when the post does not exist', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .get('/posts/00000000-0000-0000-0000-000000000000/comments')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an unauthenticated request', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Protected post.',
        },
      });

      const response = await request(app).get(`/posts/${post.id}/comments`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /comments/:commentId', () => {
    it('returns a comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Comment to retrieve.',
        },
      });

      const response = await request(app).get(`/comments/${comment.id}`).set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        comment: {
          id: comment.id,
          postId: post.id,
          authorId: user.id,
          content: 'Comment to retrieve.',
          author: {
            id: user.id,
            username: user.username,
          },
        },
      });
    });

    it('returns 404 for a nonexistent comment', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .get('/comments/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid comment ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).get('/comments/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).get('/comments/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /comments/:commentId', () => {
    it('updates an owned comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Original comment.',
        },
      });

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Cookie', cookies)
        .send({
          content: 'Updated comment.',
        });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment updated successfully.',
        comment: {
          id: comment.id,
          content: 'Updated comment.',
          author: {
            id: user.id,
            username: user.username,
          },
        },
      });
    });

    it('rejects updating another user comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Protected comment.',
        },
      });

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Cookie', cookies)
        .send({
          content: 'Unauthorized update.',
        });

      expect(response.status).toBe(403);
    });

    it('returns 404 for a nonexistent comment', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .patch('/comments/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .send({
          content: 'Update.',
        });

      expect(response.status).toBe(404);
    });

    it('rejects an invalid comment ID', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .patch('/comments/not-a-uuid')
        .set('Cookie', cookies)
        .send({
          content: 'Update.',
        });

      expect(response.status).toBe(400);
    });

    it('rejects invalid comment content', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Original.',
        },
      });

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Cookie', cookies)
        .send({
          content: '',
        });

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app)
        .patch('/comments/00000000-0000-0000-0000-000000000000')
        .send({
          content: 'Update.',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /comments/:commentId', () => {
    it('deletes an owned comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Comment to delete.',
        },
      });

      const response = await request(app).delete(`/comments/${comment.id}`).set('Cookie', cookies);

      expect(response.status).toBe(204);

      const deletedComment = await prisma.comment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(deletedComment).toBeNull();
    });

    it('rejects deleting another user comment', async () => {
      const cookies = await loginUser();

      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post.',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Protected comment.',
        },
      });

      const response = await request(app).delete(`/comments/${comment.id}`).set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('returns 404 for a nonexistent comment', async () => {
      const cookies = await loginUser();

      const response = await request(app)
        .delete('/comments/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
    });

    it('rejects an invalid comment ID', async () => {
      const cookies = await loginUser();

      const response = await request(app).delete('/comments/not-a-uuid').set('Cookie', cookies);

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app).delete('/comments/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(401);
    });
  });
});
