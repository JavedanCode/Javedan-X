import { z } from 'zod';

const postContentSchema = z
  .string()
  .trim()
  .min(1, 'Post content is required.')
  .max(5000, 'Post content must not exceed 5000 characters.');

const postImageUrlSchema = z
  .string()
  .trim()
  .url('Post image URL must be a valid URL.')
  .max(2048, 'Post image URL must not exceed 2048 characters.');

export const createPostSchema = z.object({
  content: postContentSchema,
  imageUrl: postImageUrlSchema.optional(),
});

export const updatePostSchema = z
  .object({
    content: postContentSchema.optional(),
    imageUrl: postImageUrlSchema.nullable().optional(),
  })
  .refine((data) => data.content !== undefined || data.imageUrl !== undefined, {
    message: 'At least one post field must be provided.',
  });

export const postIdParamsSchema = z.object({
  postId: z.uuid('Post ID must be a valid UUID.'),
});
