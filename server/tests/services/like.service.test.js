import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';

import {
  createLike,
  deleteLike,
  findLikeById,
  findLikeForUserOnPost,
  findLikesByPost,
  findLikesByUser,
} from '../../src/services/like.service.js';

describe('like service', () => {
  let user;
  let secondUser;
  let post;
  let secondPost;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        username: 'likeuser',
        email: 'likeuser@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'secondlikeuser',
        email: 'secondlikeuser@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: 'First test post.',
      },
    });

    secondPost = await prisma.post.create({
      data: {
        authorId: secondUser.id,
        content: 'Second test post.',
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

  describe('createLike', () => {
    it('creates a like for a post', async () => {
      const like = await createLike({
        postId: post.id,
        userId: user.id,
      });

      expect(like).toMatchObject({
        id: expect.any(String),
        postId: post.id,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
          displayName: null,
          avatarUrl: null,
        },
      });

      expect(like.createdAt).toBeInstanceOf(Date);
    });

    it('rejects liking a post more than once', async () => {
      await createLike({
        postId: post.id,
        userId: user.id,
      });

      await expect(
        createLike({
          postId: post.id,
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'LIKE_ALREADY_EXISTS',
      });
    });

    it('rejects liking a nonexistent post', async () => {
      await expect(
        createLike({
          postId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });

    it('rejects liking a post as a nonexistent user', async () => {
      await expect(
        createLike({
          postId: post.id,
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('deleteLike', () => {
    it('removes a like from a post', async () => {
      const like = await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      await deleteLike({
        postId: post.id,
        userId: user.id,
      });

      const deletedLike = await prisma.like.findUnique({
        where: {
          id: like.id,
        },
      });

      expect(deletedLike).toBeNull();
    });

    it('rejects deleting a like that does not exist', async () => {
      await expect(
        deleteLike({
          postId: post.id,
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'LIKE_NOT_FOUND',
      });
    });

    it('does not remove another users like', async () => {
      const like = await prisma.like.create({
        data: {
          postId: post.id,
          userId: secondUser.id,
        },
      });

      await expect(
        deleteLike({
          postId: post.id,
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'LIKE_NOT_FOUND',
      });

      const storedLike = await prisma.like.findUnique({
        where: {
          id: like.id,
        },
      });

      expect(storedLike).not.toBeNull();
    });
  });

  describe('findLikeById', () => {
    it('returns a like by ID', async () => {
      const like = await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const result = await findLikeById({
        likeId: like.id,
      });

      expect(result).toMatchObject({
        id: like.id,
        postId: post.id,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    });

    it('rejects a nonexistent like', async () => {
      await expect(
        findLikeById({
          likeId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'LIKE_NOT_FOUND',
      });
    });
  });

  describe('findLikeForUserOnPost', () => {
    it('returns the users like when one exists', async () => {
      const like = await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const result = await findLikeForUserOnPost({
        postId: post.id,
        userId: user.id,
      });

      expect(result).toMatchObject({
        id: like.id,
        postId: post.id,
        userId: user.id,
      });
    });

    it('returns null when the user has not liked the post', async () => {
      const result = await findLikeForUserOnPost({
        postId: post.id,
        userId: user.id,
      });

      expect(result).toBeNull();
    });

    it('rejects when the post does not exist', async () => {
      await expect(
        findLikeForUserOnPost({
          postId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });

    it('rejects when the user does not exist', async () => {
      await expect(
        findLikeForUserOnPost({
          postId: post.id,
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findLikesByPost', () => {
    it('returns all likes for a post', async () => {
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

      const result = await findLikesByPost({
        postId: post.id,
      });

      expect(result).toHaveLength(2);

      expect(result.map((like) => like.user.id)).toEqual(
        expect.arrayContaining([user.id, secondUser.id]),
      );
    });

    it('returns an empty list when a post has no likes', async () => {
      const result = await findLikesByPost({
        postId: post.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects when the post does not exist', async () => {
      await expect(
        findLikesByPost({
          postId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });

  describe('findLikesByUser', () => {
    it('returns all posts liked by a user', async () => {
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

      const result = await findLikesByUser({
        userId: user.id,
      });

      expect(result).toHaveLength(2);

      expect(result.map((like) => like.post.id)).toEqual(
        expect.arrayContaining([post.id, secondPost.id]),
      );
    });

    it('returns an empty list when a user has liked no posts', async () => {
      const result = await findLikesByUser({
        userId: user.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects when the user does not exist', async () => {
      await expect(
        findLikesByUser({
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });
});
