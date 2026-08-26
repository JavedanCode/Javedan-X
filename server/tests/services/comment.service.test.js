import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';
import {
  createComment,
  deleteComment,
  findCommentById,
  findCommentsByPost,
  updateComment,
} from '../../src/services/comment.service.js';

describe('comment service', () => {
  let user;
  let secondUser;
  let post;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        username: 'commentuser',
        email: 'commentuser@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'commentuser2',
        email: 'commentuser2@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: 'Post for comment tests.',
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

  describe('createComment', () => {
    it('creates a comment with its author', async () => {
      const comment = await createComment({
        postId: post.id,
        authorId: secondUser.id,
        content: 'This is a comment.',
      });

      expect(comment).toMatchObject({
        id: expect.any(String),
        postId: post.id,
        authorId: secondUser.id,
        content: 'This is a comment.',
        author: {
          id: secondUser.id,
          username: 'commentuser2',
          displayName: null,
          avatarUrl: null,
        },
      });

      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects a comment on a nonexistent post', async () => {
      await expect(
        createComment({
          postId: '00000000-0000-0000-0000-000000000000',
          authorId: secondUser.id,
          content: 'This should fail.',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });

    it('rejects a comment from a nonexistent user', async () => {
      await expect(
        createComment({
          postId: post.id,
          authorId: '00000000-0000-0000-0000-000000000000',
          content: 'This should fail.',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findCommentById', () => {
    it('finds a comment with its author', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Comment to retrieve.',
        },
      });

      const result = await findCommentById({
        commentId: comment.id,
      });

      expect(result).toMatchObject({
        id: comment.id,
        postId: post.id,
        authorId: secondUser.id,
        content: 'Comment to retrieve.',
        author: {
          id: secondUser.id,
          username: 'commentuser2',
          displayName: null,
          avatarUrl: null,
        },
      });
    });

    it('rejects a nonexistent comment', async () => {
      await expect(
        findCommentById({
          commentId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'COMMENT_NOT_FOUND',
      });
    });
  });

  describe('findCommentsByPost', () => {
    it('returns all comments for a post in ascending creation order', async () => {
      const firstComment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'First comment.',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const secondComment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Second comment.',
        },
      });

      const result = await findCommentsByPost({
        postId: post.id,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(firstComment.id);
      expect(result[1].id).toBe(secondComment.id);

      expect(result[0].author.username).toBe('commentuser');
      expect(result[1].author.username).toBe('commentuser2');
    });

    it('returns an empty list when a post has no comments', async () => {
      const result = await findCommentsByPost({
        postId: post.id,
      });

      expect(result).toEqual([]);
    });

    it('rejects comments for a nonexistent post', async () => {
      await expect(
        findCommentsByPost({
          postId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });

  describe('updateComment', () => {
    it('updates a comment owned by the user', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Original comment.',
        },
      });

      const updatedComment = await updateComment({
        commentId: comment.id,
        userId: user.id,
        content: 'Updated comment.',
      });

      expect(updatedComment).toMatchObject({
        id: comment.id,
        content: 'Updated comment.',
        author: {
          id: user.id,
          username: 'commentuser',
        },
      });
    });

    it('rejects updating another user comment', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Protected comment.',
        },
      });

      await expect(
        updateComment({
          commentId: comment.id,
          userId: user.id,
          content: 'Unauthorized update.',
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'COMMENT_UPDATE_FORBIDDEN',
      });
    });

    it('rejects updating a nonexistent comment', async () => {
      await expect(
        updateComment({
          commentId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
          content: 'Update.',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'COMMENT_NOT_FOUND',
      });
    });
  });

  describe('deleteComment', () => {
    it('deletes a comment owned by the user', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'Comment to delete.',
        },
      });

      await deleteComment({
        commentId: comment.id,
        userId: user.id,
      });

      const deletedComment = await prisma.comment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(deletedComment).toBeNull();
    });

    it('rejects deleting another user comment', async () => {
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Protected comment.',
        },
      });

      await expect(
        deleteComment({
          commentId: comment.id,
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'COMMENT_DELETE_FORBIDDEN',
      });
    });

    it('rejects deleting a nonexistent comment', async () => {
      await expect(
        deleteComment({
          commentId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'COMMENT_NOT_FOUND',
      });
    });
  });
});
