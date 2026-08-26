import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';

const commentAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

const commentInclude = {
  author: {
    select: commentAuthorSelect,
  },
};

export async function createComment({ postId, authorId, content }) {
  const [post, author] = await Promise.all([
    prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: authorId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  if (!author) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return prisma.comment.create({
    data: {
      postId,
      authorId,
      content,
    },
    include: commentInclude,
  });
}

export async function findCommentById({ commentId }) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: commentInclude,
  });

  if (!comment) {
    throw new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND');
  }

  return comment;
}

export async function findCommentsByPost({ postId }) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  return prisma.comment.findMany({
    where: {
      postId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: commentInclude,
  });
}

export async function updateComment({ commentId, userId, content }) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND');
  }

  if (comment.authorId !== userId) {
    throw new AppError(
      'You are not authorized to update this comment.',
      403,
      'COMMENT_UPDATE_FORBIDDEN',
    );
  }

  return prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
    include: commentInclude,
  });
}

export async function deleteComment({ commentId, userId }) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND');
  }

  if (comment.authorId !== userId) {
    throw new AppError(
      'You are not authorized to delete this comment.',
      403,
      'COMMENT_DELETE_FORBIDDEN',
    );
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
}
