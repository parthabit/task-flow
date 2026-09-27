import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Task, ITask } from '../models/Task.model';

/**
 * GET /api/tasks
 * Supports search (text), filter (status/priority/project), sort, and pagination.
 * Example: /api/tasks?search=redesign&status=in_progress&sort=-createdAt&page=2&limit=10
 */
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const { search, status, priority, project } = req.query as Record<string, string | undefined>;

  const filter: FilterQuery<ITask> = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (search) filter.$text = { $search: search };

  const sortParam = (req.query.sort as string) || '-createdAt';
  const sort = sortParam
    .split(',')
    .reduce<Record<string, 1 | -1>>((acc, field) => {
      const direction = field.startsWith('-') ? -1 : 1;
      const key = field.replace(/^-/, '');
      acc[key] = direction;
      return acc;
    }, {});

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatarColor')
      .populate('project', 'name color')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.paginated({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }),
  );
});

/** POST /api/tasks */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.create({ ...req.body, createdBy: req.user!.sub });
  const populated = await task.populate([
    { path: 'assignee', select: 'name email avatarColor' },
    { path: 'project', select: 'name color' },
  ]);
  res.status(201).json(ApiResponse.success(populated, 'Task created'));
});

/** GET /api/tasks/:id */
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatarColor')
    .populate('project', 'name color');
  if (!task) throw ApiError.notFound('Task not found');
  res.json(ApiResponse.success(task));
});

/** PATCH /api/tasks/:id */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignee', 'name email avatarColor')
    .populate('project', 'name color');
  if (!task) throw ApiError.notFound('Task not found');
  res.json(ApiResponse.success(task, 'Task updated'));
});

/** DELETE /api/tasks/:id */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  res.json(ApiResponse.success(null, 'Task deleted'));
});
