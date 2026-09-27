import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';

/** GET /api/projects - projects the user owns or is a member of */
export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const isAdmin = req.user!.role === 'admin';
  const filter = isAdmin ? {} : { $or: [{ owner: userId }, { members: userId }] };

  const projects = await Project.find(filter)
    .populate('owner', 'name email avatarColor')
    .populate('members', 'name email avatarColor')
    .sort({ createdAt: -1 });

  res.json(ApiResponse.success(projects));
});

/** POST /api/projects */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color, members } = req.body;
  const project = await Project.create({
    name,
    description,
    color,
    members: members || [],
    owner: req.user!.sub,
  });
  res.status(201).json(ApiResponse.success(project, 'Project created'));
});

/** GET /api/projects/:id */
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatarColor')
    .populate('members', 'name email avatarColor');
  if (!project) throw ApiError.notFound('Project not found');
  res.json(ApiResponse.success(project));
});

/** PATCH /api/projects/:id */
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  assertCanManage(project.owner.toString(), req.user!);
  Object.assign(project, req.body);
  await project.save();
  res.json(ApiResponse.success(project, 'Project updated'));
});

/** DELETE /api/projects/:id */
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  assertCanManage(project.owner.toString(), req.user!);
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json(ApiResponse.success(null, 'Project deleted'));
});

function assertCanManage(ownerId: string, user: { sub: string; role: string }) {
  if (user.role !== 'admin' && ownerId !== user.sub) {
    throw ApiError.forbidden('Only the project owner or an admin can do this');
  }
}
