import { z } from 'zod';

export const likeIdParamsSchema = z.object({
  likeId: z.uuid('Like ID must be a valid UUID.'),
});

export const likePostParamsSchema = z.object({
  postId: z.uuid('Post ID must be a valid UUID.'),
});

export const likeUserParamsSchema = z.object({
  userId: z.uuid('User ID must be a valid UUID.'),
});
