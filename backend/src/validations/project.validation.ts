import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(1000).optional(),
    color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).optional(),
    members: z.array(z.string()).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: createProjectSchema.shape.body.partial(),
});
