import { z } from 'zod';

const statusEnum = z.enum(['todo', 'in_progress', 'in_review', 'done']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().max(2000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
    project: z.string().min(1, 'Project is required'),
    assignee: z.string().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: createTaskSchema.shape.body.partial(),
});

export const listTaskQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    search: z.string().optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    project: z.string().optional(),
  }),
});
