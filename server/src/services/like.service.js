import { prisma } from '../db/prisma.js';

import { AppError } from '../errors/AppError.js';

const likeUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

const likedPostSelect = {
  id: true,
  authorId: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
};

export async function createLike({ postId, userId }) {
  const [post, user] = await Promise.all([
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
        id: userId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingLike) {
    throw new AppError('You already liked this post.', 409, 'LIKE_ALREADY_EXISTS');
  }

  return prisma.like.create({
    data: {
      postId,
      userId,
    },
    include: {
      user: {
        select: likeUserSelect,
      },
    },
  });
}

export async function deleteLike({ postId, userId }) {
  const like = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!like) {
    throw new AppError('Like not found.', 404, 'LIKE_NOT_FOUND');
  }

  await prisma.like.delete({
    where: {
      id: like.id,
    },
  });
}

export async function findLikeById({ likeId }) {
  const like = await prisma.like.findUnique({
    where: {
      id: likeId,
    },
    include: {
      user: {
        select: likeUserSelect,
      },
    },
  });

  if (!like) {
    throw new AppError('Like not found.', 404, 'LIKE_NOT_FOUND');
  }

  return like;
}

export async function findLikeForUserOnPost({ postId, userId }) {
  const [post, user] = await Promise.all([
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
        id: userId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    include: {
      user: {
        select: likeUserSelect,
      },
    },
  });
}

export async function findLikesByPost({ postId }) {
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

  return prisma.like.findMany({
    where: {
      postId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: likeUserSelect,
      },
    },
  });
}

export async function findLikesByUser({ userId }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return prisma.like.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      post: {
        select: likedPostSelect,
      },
    },
  });
}
