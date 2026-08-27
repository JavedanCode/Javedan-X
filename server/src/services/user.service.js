import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';
import { verifyPassword, hashPassword } from './password.service.js';
import { revokeAllUserSessions } from './session.service.js';

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
};

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: publicUserSelect,
  });
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return user;
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function findUserById(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
}

export async function createUser({ username, email, passwordHash, emailVerifiedAt }) {
  // Perform friendly application-level checks before attempting the database insert.
  // The database unique constraints remain the final protection against race conditions.
  const existingEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingEmail) {
    throw new AppError('Email is already registered.', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const existingUsername = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUsername) {
    throw new AppError('Username is already taken.', 409, 'USERNAME_ALREADY_EXISTS');
  }

  return prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      emailVerifiedAt,
    },
  });
}

export async function changeUserPassword({ userId, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!currentPasswordValid) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const samePassword = await verifyPassword(newPassword, user.passwordHash);

  if (samePassword) {
    throw new AppError(
      'New password must be different from your current password.',
      400,
      'PASSWORD_UNCHANGED',
    );
  }

  const passwordHash = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
    },
  });

  await revokeAllUserSessions(userId);

  return updatedUser;
}

export async function updateUserProfile({ userId, displayName, bio, avatarUrl }) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
    },
  });

  return user;
}

export async function changeUsername({ userId, username }) {
  const existingUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new AppError('Username is already taken.', 409, 'USERNAME_ALREADY_EXISTS');
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      username,
    },
  });
}

export async function deleteUserAccount({ userId, currentPassword }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new AppError('Current password is required.', 400, 'CURRENT_PASSWORD_REQUIRED');
    }

    const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

    if (!currentPasswordValid) {
      throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
    }
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
}
