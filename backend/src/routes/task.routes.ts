import { Router } from 'express';
import { listTasks, createTask, getTask, updateTask, deleteTask } from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema, listTaskQuerySchema } from '../validations/task.validation';

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks — search, filter, sort, paginate
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search across title + description
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, in_review, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Filter by project id
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: -createdAt }
 *         description: Comma-separated fields; prefix with "-" for descending
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, project]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               project: { type: string }
 *               status: { type: string, enum: [todo, in_progress, in_review, done] }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *               dueDate: { type: string, format: date-time }
 *               assignee: { type: string }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 */
router.get('/', validate(listTaskQuerySchema), listTasks);
router.post('/', validate(createTaskSchema), createTask);

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The task
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       404: { description: Task not found }
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Task' }
 *     responses:
 *       200: { description: Task updated }
 *       404: { description: Task not found }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task deleted }
 *       404: { description: Task not found }
 */
router.get('/:id', getTask);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
