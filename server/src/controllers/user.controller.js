import {
  changeUserPassword,
  updateUserProfile,
  changeUsername,
  deleteUserAccount,
  getAllUsers,
  getUserById,
} from '../services/user.service.js';

import { requestEmailChange, confirmEmailChange } from '../services/email-change.service.js';

import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookies.js';

export async function getUsers(req, res, next) {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getUser(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    const user = await updateUserProfile({
      userId: req.user.id,
      displayName,
      bio,
      avatarUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    await changeUserPassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function changeUsernameController(req, res, next) {
  try {
    const { username } = req.body;

    const user = await changeUsername({
      userId: req.user.id,
      username,
    });

    return res.status(200).json({
      success: true,
      message: 'Username updated successfully.',
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function requestEmailChangeController(req, res, next) {
  try {
    const { email } = req.body;

    await requestEmailChange(req.user.id, email);

    return res.status(200).json({
      success: true,
      message: 'If the email can be changed, a verification email will be sent.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function confirmEmailChangeController(req, res, next) {
  try {
    const { token } = req.body;

    await confirmEmailChange(req.user.id, token);

    return res.status(200).json({
      success: true,
      message: 'Email address changed successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { currentPassword } = req.body;

    await deleteUserAccount({
      userId: req.user.id,
      currentPassword,
    });

    res.clearCookie('accessToken', accessTokenCookieOptions);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
