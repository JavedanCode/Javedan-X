import { z } from 'zod';

export const recipientIdParamsSchema = z.object({
  recipientId: z.uuid('Recipient ID must be a valid UUID.'),
});

export const followIdParamsSchema = z.object({
  followId: z.uuid('Follow ID must be a valid UUID.'),
});
