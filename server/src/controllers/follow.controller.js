import {
  createFollowRequest as createFollowRequestService,
  acceptFollowRequest as acceptFollowRequestService,
  declineFollowRequest as declineFollowRequestService,
  cancelFollowRequest as cancelFollowRequestService,
  removeFollow as removeFollowService,
  findFollowing,
  findFollowers,
  findPendingFollowRequests,
  findPendingSentFollowRequests,
} from '../services/follow.service.js';

export async function createFollowRequest(req, res, next) {
  try {
    const { recipientId } = req.params;

    const follow = await createFollowRequestService({
      requesterId: req.user.id,
      recipientId,
    });

    return res.status(201).json({
      success: true,
      message: 'Follow request sent successfully.',
      follow,
    });
  } catch (error) {
    return next(error);
  }
}

export async function acceptFollowRequest(req, res, next) {
  try {
    const { followId } = req.params;

    const follow = await acceptFollowRequestService({
      followId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Follow request accepted successfully.',
      follow,
    });
  } catch (error) {
    return next(error);
  }
}

export async function declineFollowRequest(req, res, next) {
  try {
    const { followId } = req.params;

    const follow = await declineFollowRequestService({
      followId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Follow request declined successfully.',
      follow,
    });
  } catch (error) {
    return next(error);
  }
}

export async function cancelFollowRequest(req, res, next) {
  try {
    const { followId } = req.params;

    await cancelFollowRequestService({
      followId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function removeFollow(req, res, next) {
  try {
    const { followId } = req.params;

    await removeFollowService({
      followId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function getFollowing(req, res, next) {
  try {
    const following = await findFollowing({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      following,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFollowers(req, res, next) {
  try {
    const followers = await findFollowers({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      followers,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPendingFollowRequests(req, res, next) {
  try {
    const requests = await findPendingFollowRequests({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPendingSentFollowRequests(req, res, next) {
  try {
    const sentRequests = await findPendingSentFollowRequests({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      sentRequests,
    });
  } catch (error) {
    return next(error);
  }
}
