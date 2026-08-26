import {
  createPost as createPostService,
  findPostById,
  findPostsByUser,
  findFeed,
  updatePost as updatePostService,
  deletePost as deletePostService,
} from '../services/post.service.js';

export async function createPost(req, res, next) {
  try {
    const { content, imageUrl } = req.body;

    const post = await createPostService({
      authorId: req.user.id,
      content,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPostById(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await findPostById({
      postId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPostsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const posts = await findPostsByUser({
      targetUserId: userId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFeed(req, res, next) {
  try {
    const posts = await findFeed({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;
    const { content, imageUrl } = req.body;

    const post = await updatePostService({
      postId,
      userId: req.user.id,
      content,
      imageUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;

    await deletePostService({
      postId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
