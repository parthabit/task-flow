import { Router } from 'express';
import { getSummary } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Aggregated analytics for the current user (org-wide if admin)
 *     responses:
 *       200:
 *         description: Totals, breakdowns by status/priority, and a 7-day trend
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTasks: { type: integer }
 *                 totalProjects: { type: integer }
 *                 overdue: { type: integer }
 *                 totalUsers: { type: integer, description: 'Admins only' }
 *                 byStatus:
 *                   type: array
 *                   items: { type: object, properties: { name: { type: string }, value: { type: integer } } }
 *                 byPriority:
 *                   type: array
 *                   items: { type: object, properties: { name: { type: string }, value: { type: integer } } }
 *                 last7Days:
 *                   type: array
 *                   items: { type: object, properties: { _id: { type: string }, count: { type: integer } } }
 */
router.get('/summary', requireAuth, getSummary);

export default router;
