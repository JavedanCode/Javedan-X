import { z } from 'zod';

const commentContentSchema = z
  .string()
  .trim()
  .min(1, 'Comment content is required.')
  .max(2000, 'Comment content must not exceed 2000 characters.');

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});

export const commentIdParamsSchema = z.object({
  commentId: z.uuid('Comment ID must be a valid UUID.'),
});
