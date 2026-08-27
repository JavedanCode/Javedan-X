import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';

const followUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
};

export async function createFollowRequest({ requesterId, recipientId }) {
  if (requesterId === recipientId) {
    throw new AppError(
      'You cannot send a follow request to yourself.',
      400,
      'SELF_FOLLOW_NOT_ALLOWED',
    );
  }

  const [requester, recipient, existingFollow] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: requesterId,
      },
      select: {
        id: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: recipientId,
      },
      select: {
        id: true,
      },
    }),

    prisma.follow.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId,
          recipientId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!requester) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (!recipient) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (existingFollow) {
    if (existingFollow.status === 'PENDING') {
      throw new AppError(
        'A follow request is already pending.',
        409,
        'FOLLOW_REQUEST_ALREADY_PENDING',
      );
    }

    if (existingFollow.status === 'ACCEPTED') {
      throw new AppError('You are already following this user.', 409, 'ALREADY_FOLLOWING');
    }

    throw new AppError(
      'A follow request already exists for this user.',
      409,
      'FOLLOW_REQUEST_ALREADY_EXISTS',
    );
  }

  return prisma.follow.create({
    data: {
      requesterId,
      recipientId,
      status: 'PENDING',
    },
    include: {
      requester: {
        select: followUserSelect,
      },
      recipient: {
        select: followUserSelect,
      },
    },
  });
}

export async function acceptFollowRequest({ followId, userId }) {
  const follow = await prisma.follow.findUnique({
    where: {
      id: followId,
    },
    select: {
      id: true,
      recipientId: true,
      status: true,
    },
  });

  if (!follow) {
    throw new AppError('Follow request not found.', 404, 'FOLLOW_NOT_FOUND');
  }

  if (follow.recipientId !== userId) {
    throw new AppError(
      'You are not authorized to accept this follow request.',
      403,
      'FOLLOW_ACCEPT_FORBIDDEN',
    );
  }

  if (follow.status !== 'PENDING') {
    throw new AppError(
      'Only pending follow requests can be accepted.',
      409,
      'FOLLOW_REQUEST_NOT_PENDING',
    );
  }

  return prisma.follow.update({
    where: {
      id: followId,
    },
    data: {
      status: 'ACCEPTED',
    },
    include: {
      requester: {
        select: followUserSelect,
      },
      recipient: {
        select: followUserSelect,
      },
    },
  });
}

export async function declineFollowRequest({ followId, userId }) {
  const follow = await prisma.follow.findUnique({
    where: {
      id: followId,
    },
    select: {
      id: true,
      recipientId: true,
      status: true,
    },
  });

  if (!follow) {
    throw new AppError('Follow request not found.', 404, 'FOLLOW_NOT_FOUND');
  }

  if (follow.recipientId !== userId) {
    throw new AppError(
      'You are not authorized to decline this follow request.',
      403,
      'FOLLOW_DECLINE_FORBIDDEN',
    );
  }

  if (follow.status !== 'PENDING') {
    throw new AppError(
      'Only pending follow requests can be declined.',
      409,
      'FOLLOW_REQUEST_NOT_PENDING',
    );
  }

  return prisma.follow.update({
    where: {
      id: followId,
    },
    data: {
      status: 'DECLINED',
    },
    include: {
      requester: {
        select: followUserSelect,
      },
      recipient: {
        select: followUserSelect,
      },
    },
  });
}

export async function cancelFollowRequest({ followId, userId }) {
  const follow = await prisma.follow.findUnique({
    where: {
      id: followId,
    },
    select: {
      id: true,
      requesterId: true,
      status: true,
    },
  });

  if (!follow) {
    throw new AppError('Follow request not found.', 404, 'FOLLOW_NOT_FOUND');
  }

  if (follow.requesterId !== userId) {
    throw new AppError(
      'You are not authorized to cancel this follow request.',
      403,
      'FOLLOW_CANCEL_FORBIDDEN',
    );
  }

  if (follow.status !== 'PENDING') {
    throw new AppError(
      'Only pending follow requests can be cancelled.',
      409,
      'FOLLOW_REQUEST_NOT_PENDING',
    );
  }

  await prisma.follow.delete({
    where: {
      id: followId,
    },
  });
}

export async function removeFollow({ followId, userId }) {
  const follow = await prisma.follow.findUnique({
    where: {
      id: followId,
    },
    select: {
      id: true,
      requesterId: true,
      status: true,
    },
  });

  if (!follow) {
    throw new AppError('Follow relationship not found.', 404, 'FOLLOW_NOT_FOUND');
  }

  if (follow.requesterId !== userId) {
    throw new AppError(
      'You are not authorized to remove this follow relationship.',
      403,
      'FOLLOW_REMOVE_FORBIDDEN',
    );
  }

  if (follow.status !== 'ACCEPTED') {
    throw new AppError(
      'Only accepted follow relationships can be removed.',
      409,
      'FOLLOW_NOT_ACCEPTED',
    );
  }

  await prisma.follow.delete({
    where: {
      id: followId,
    },
  });
}

export async function findFollowing({ userId }) {
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

  return prisma.follow.findMany({
    where: {
      requesterId: userId,
      status: 'ACCEPTED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      recipient: {
        select: followUserSelect,
      },
    },
  });
}

export async function findFollowers({ userId }) {
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

  return prisma.follow.findMany({
    where: {
      recipientId: userId,
      status: 'ACCEPTED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      requester: {
        select: followUserSelect,
      },
    },
  });
}

export async function findPendingFollowRequests({ userId }) {
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

  return prisma.follow.findMany({
    where: {
      recipientId: userId,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      requester: {
        select: followUserSelect,
      },
    },
  });
}

export async function findPendingSentFollowRequests({ userId }) {
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

  return prisma.follow.findMany({
    where: {
      requesterId: userId,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      recipient: {
        select: followUserSelect,
      },
    },
  });
}
