import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';

const postAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

const commentAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

const postInclude = {
  author: {
    select: postAuthorSelect,
  },
  comments: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      author: {
        select: commentAuthorSelect,
      },
    },
  },
  _count: {
    select: {
      likes: true,
    },
  },
};

function mapPost(post) {
  return {
    id: post.id,
    authorId: post.authorId,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    comments: post.comments,
    likeCount: post._count.likes,
    likedByCurrentUser: post.likes.length > 0,
  };
}

async function findPostForUser(postId, userId) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: {
      ...postInclude,
      likes: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  return post;
}

export async function createPost({ authorId, content, imageUrl }) {
  const author = await prisma.user.findUnique({
    where: {
      id: authorId,
    },
    select: {
      id: true,
    },
  });

  if (!author) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const post = await prisma.post.create({
    data: {
      authorId,
      content,
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: {
      ...postInclude,
      likes: {
        where: {
          userId: authorId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return mapPost(post);
}

export async function findPostById({ postId, userId }) {
  const post = await findPostForUser(postId, userId);

  return mapPost(post);
}

export async function findPostsByUser({ targetUserId, userId }) {
  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: targetUserId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      ...postInclude,
      likes: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return posts.map(mapPost);
}

export async function findFeed({ userId }) {
  const following = await prisma.follow.findMany({
    where: {
      requesterId: userId,
      status: 'ACCEPTED',
    },
    select: {
      recipientId: true,
    },
  });

  const authorIds = [userId, ...following.map((follow) => follow.recipientId)];

  const posts = await prisma.post.findMany({
    where: {
      authorId: {
        in: authorIds,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      ...postInclude,
      likes: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return posts.map(mapPost);
}

export async function updatePost({ postId, userId, content, imageUrl }) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  if (post.authorId !== userId) {
    throw new AppError('You are not authorized to update this post.', 403, 'POST_UPDATE_FORBIDDEN');
  }

  const updatedPost = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: {
      ...postInclude,
      likes: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return mapPost(updatedPost);
}

export async function deletePost({ postId, userId }) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }

  if (post.authorId !== userId) {
    throw new AppError('You are not authorized to delete this post.', 403, 'POST_DELETE_FORBIDDEN');
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
}
