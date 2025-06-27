const express = require('express')
const router = express.Router()
const studyPlanController = require('../controllers/StudyPlanController')
const studyTaskController = require('../controllers/StudyTaskController')
const { authenticateToken } = require('../middleware/auth')

// 学习计划相关路由
router.get('/', authenticateToken, studyPlanController.getUserStudyPlans)
router.post('/', authenticateToken, studyPlanController.createStudyPlan)
router.get('/progress', authenticateToken, studyPlanController.getStudyProgress)
router.get('/:id', authenticateToken, studyPlanController.getStudyPlanById)
router.put('/:id', authenticateToken, studyPlanController.updateStudyPlan)
router.delete('/:id', authenticateToken, studyPlanController.deleteStudyPlan)

// 学习任务相关路由
router.post('/tasks', authenticateToken, studyTaskController.createTask)
router.get('/tasks/:id', authenticateToken, studyTaskController.getTaskById)
router.put('/tasks/:id', authenticateToken, studyTaskController.updateTask)
router.patch('/tasks/:id/status', authenticateToken, studyTaskController.updateTaskStatus)
router.delete('/tasks/:id', authenticateToken, studyTaskController.deleteTask)

// 子任务相关路由
router.post('/tasks/:task_id/subtasks', authenticateToken, studyTaskController.addSubTask)
router.put('/subtasks/:subtask_id', authenticateToken, studyTaskController.updateSubTask)
router.delete('/subtasks/:subtask_id', authenticateToken, studyTaskController.deleteSubTask)

module.exports = router