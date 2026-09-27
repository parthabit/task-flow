import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { Task } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { User } from '../models/User.model';

/**
 * GET /api/dashboard/summary
 * Aggregates task counts by status/priority and recent activity for charts.
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'admin';
  const scope = isAdmin ? {} : { createdBy: req.user!.sub };

  const [byStatus, byPriority, totalTasks, totalProjects, overdue, totalUsers] = await Promise.all([
    Task.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: scope }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments(scope),
    Project.countDocuments(isAdmin ? {} : { owner: req.user!.sub }),
    Task.countDocuments({ ...scope, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
    isAdmin ? User.countDocuments() : Promise.resolve(undefined),
  ]);

  const last7Days = await Task.aggregate([
    { $match: { ...scope, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(
    ApiResponse.success({
      totalTasks,
      totalProjects,
      overdue,
      ...(totalUsers !== undefined ? { totalUsers } : {}),
      byStatus: normalize(byStatus),
      byPriority: normalize(byPriority),
      last7Days,
    }),
  );
});

function normalize(rows: { _id: string; count: number }[]) {
  return rows.map((r) => ({ name: r._id, value: r.count }));
}
