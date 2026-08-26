import {
  createLike as createLikeService,
  deleteLike as deleteLikeService,
  findLikeById,
  findLikeForUserOnPost,
  findLikesByPost,
  findLikesByUser,
} from '../services/like.service.js';

export async function createLike(req, res, next) {
  try {
    const { postId } = req.params;

    const like = await createLikeService({
      postId,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Post liked successfully.',
      like,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteLike(req, res, next) {
  try {
    const { postId } = req.params;

    await deleteLikeService({
      postId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function getLikeById(req, res, next) {
  try {
    const { likeId } = req.params;

    const like = await findLikeById({
      likeId,
    });

    return res.status(200).json({
      success: true,
      like,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUserLike(req, res, next) {
  try {
    const { postId } = req.params;

    const like = await findLikeForUserOnPost({
      postId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      liked: like !== null,
      like,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLikesByPost(req, res, next) {
  try {
    const { postId } = req.params;

    const likes = await findLikesByPost({
      postId,
    });

    return res.status(200).json({
      success: true,
      likes,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLikesByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const likes = await findLikesByUser({
      userId,
    });

    return res.status(200).json({
      success: true,
      likes,
    });
  } catch (error) {
    return next(error);
  }
}
