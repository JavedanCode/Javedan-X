import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db/prisma.js';
import {
  createPost,
  deletePost,
  findFeed,
  findPostById,
  findPostsByUser,
  updatePost,
} from '../../src/services/post.service.js';

describe('post service', () => {
  let user;
  let secondUser;
  let thirdUser;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        username: 'postuser',
        email: 'postuser@example.com',
        emailVerifiedAt: new Date(),
      },
    });

    secondUser = await prisma.user.create({
      data: {
        username: 'seconduser',
        email: 'seconduser@example.com',
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
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createPost', () => {
    it('creates a post', async () => {
      const post = await createPost({
        authorId: user.id,
        content: 'My first post.',
      });

      expect(post).toMatchObject({
        id: expect.any(String),
        authorId: user.id,
        content: 'My first post.',
        imageUrl: null,
        likeCount: 0,
        likedByCurrentUser: false,
        author: {
          id: user.id,
          username: 'postuser',
          displayName: null,
          avatarUrl: null,
        },
        comments: [],
      });

      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a post with an image URL', async () => {
      const imageUrl = 'https://example.com/image.jpg';

      const post = await createPost({
        authorId: user.id,
        content: 'A post with an image.',
        imageUrl,
      });

      expect(post.imageUrl).toBe(imageUrl);
    });

    it('rejects a post created by a nonexistent user', async () => {
      await expect(
        createPost({
          authorId: '00000000-0000-0000-0000-000000000000',
          content: 'This should fail.',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findPostById', () => {
    it('finds a post with its author, comments, and like information', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Post to retrieve.',
        },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: 'This is a comment.',
        },
      });

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      const result = await findPostById({
        postId: post.id,
        userId: user.id,
      });

      expect(result).toMatchObject({
        id: post.id,
        authorId: secondUser.id,
        content: 'Post to retrieve.',
        likeCount: 1,
        likedByCurrentUser: true,
        author: {
          id: secondUser.id,
          username: 'seconduser',
        },
      });

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toMatchObject({
        content: 'This is a comment.',
        author: {
          id: user.id,
          username: 'postuser',
        },
      });
    });

    it('returns likedByCurrentUser as false when the current user has not liked the post', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Unliked post.',
        },
      });

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: thirdUser.id,
        },
      });

      const result = await findPostById({
        postId: post.id,
        userId: user.id,
      });

      expect(result.likeCount).toBe(1);
      expect(result.likedByCurrentUser).toBe(false);
    });

    it('orders comments from oldest to newest', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Comment ordering test.',
        },
      });

      await prisma.comment.createMany({
        data: [
          {
            postId: post.id,
            authorId: user.id,
            content: 'First comment.',
          },
          {
            postId: post.id,
            authorId: thirdUser.id,
            content: 'Second comment.',
          },
        ],
      });

      const result = await findPostById({
        postId: post.id,
        userId: user.id,
      });

      expect(result.comments[0].content).toBe('First comment.');
      expect(result.comments[1].content).toBe('Second comment.');
    });

    it('rejects a nonexistent post', async () => {
      await expect(
        findPostById({
          postId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });

  describe('findPostsByUser', () => {
    it('returns all posts created by a user in descending creation order', async () => {
      const olderPost = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Older post.',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const newerPost = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Newer post.',
        },
      });

      const result = await findPostsByUser({
        targetUserId: secondUser.id,
        userId: user.id,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(newerPost.id);
      expect(result[1].id).toBe(olderPost.id);
    });

    it('does not return posts belonging to another user', async () => {
      await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: `Second user's post.`,
        },
      });

      await prisma.post.create({
        data: {
          authorId: thirdUser.id,
          content: `Third user's post.`,
        },
      });

      const result = await findPostsByUser({
        targetUserId: secondUser.id,
        userId: user.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].authorId).toBe(secondUser.id);
    });

    it('rejects a nonexistent target user', async () => {
      await expect(
        findPostsByUser({
          targetUserId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('findFeed', () => {
    it('includes the current user posts', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'My own post.',
        },
      });

      const result = await findFeed({
        userId: user.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(post.id);
    });

    it('includes posts from accepted follows', async () => {
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
          content: 'Accepted follow post.',
        },
      });

      const result = await findFeed({
        userId: user.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(post.id);
    });

    it('excludes posts from pending follows', async () => {
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

      const result = await findFeed({
        userId: user.id,
      });

      expect(result).toHaveLength(0);
    });

    it('excludes posts from declined follows', async () => {
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

      const result = await findFeed({
        userId: user.id,
      });

      expect(result).toHaveLength(0);
    });

    it('orders feed posts from newest to oldest', async () => {
      const olderPost = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Older post.',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const newerPost = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Newer post.',
        },
      });

      const result = await findFeed({
        userId: user.id,
      });

      expect(result[0].id).toBe(newerPost.id);
      expect(result[1].id).toBe(olderPost.id);
    });
  });

  describe('updatePost', () => {
    it('updates a post owned by the user', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Original content.',
        },
      });

      const updatedPost = await updatePost({
        postId: post.id,
        userId: user.id,
        content: 'Updated content.',
      });

      expect(updatedPost.content).toBe('Updated content.');
      expect(updatedPost.authorId).toBe(user.id);
    });

    it('updates the image URL', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post with image.',
          imageUrl: 'https://example.com/old.jpg',
        },
      });

      const updatedPost = await updatePost({
        postId: post.id,
        userId: user.id,
        imageUrl: 'https://example.com/new.jpg',
      });

      expect(updatedPost.imageUrl).toBe('https://example.com/new.jpg');
    });

    it('removes the image when imageUrl is null', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post with image.',
          imageUrl: 'https://example.com/image.jpg',
        },
      });

      const updatedPost = await updatePost({
        postId: post.id,
        userId: user.id,
        imageUrl: null,
      });

      expect(updatedPost.imageUrl).toBeNull();
    });

    it('rejects updating another user post', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Someone else post.',
        },
      });

      await expect(
        updatePost({
          postId: post.id,
          userId: user.id,
          content: 'Unauthorized update.',
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'POST_UPDATE_FORBIDDEN',
      });
    });

    it('rejects updating a nonexistent post', async () => {
      await expect(
        updatePost({
          postId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
          content: 'Update.',
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });

  describe('deletePost', () => {
    it('deletes a post owned by the user', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post to delete.',
        },
      });

      await deletePost({
        postId: post.id,
        userId: user.id,
      });

      const deletedPost = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });

      expect(deletedPost).toBeNull();
    });

    it('cascades deletion to comments and likes', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          content: 'Post with relations.',
        },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: secondUser.id,
          content: 'Comment.',
        },
      });

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: secondUser.id,
        },
      });

      await deletePost({
        postId: post.id,
        userId: user.id,
      });

      const comments = await prisma.comment.findMany({
        where: {
          postId: post.id,
        },
      });

      const likes = await prisma.like.findMany({
        where: {
          postId: post.id,
        },
      });

      expect(comments).toHaveLength(0);
      expect(likes).toHaveLength(0);
    });

    it('rejects deleting another user post', async () => {
      const post = await prisma.post.create({
        data: {
          authorId: secondUser.id,
          content: 'Someone else post.',
        },
      });

      await expect(
        deletePost({
          postId: post.id,
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'POST_DELETE_FORBIDDEN',
      });
    });

    it('rejects deleting a nonexistent post', async () => {
      await expect(
        deletePost({
          postId: '00000000-0000-0000-0000-000000000000',
          userId: user.id,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });
});
