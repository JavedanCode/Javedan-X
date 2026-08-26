import {
  createComment as createCommentService,
  findCommentById,
  findCommentsByPost,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
} from '../services/comment.service.js';

export async function createComment(req, res, next) {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    const comment = await createCommentService({
      postId,
      authorId: req.user.id,
      content,
    });

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully.',
      comment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCommentById(req, res, next) {
  try {
    const { commentId } = req.params;

    const comment = await findCommentById({
      commentId,
    });

    return res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCommentsByPost(req, res, next) {
  try {
    const { postId } = req.params;

    const comments = await findCommentsByPost({
      postId,
    });

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await updateCommentService({
      commentId,
      userId: req.user.id,
      content,
    });

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;

    await deleteCommentService({
      commentId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
