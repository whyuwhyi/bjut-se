const express = require('express')
const router = express.Router()
const studyPlanController = require('../controllers/StudyPlanController')
const studyTaskController = require('../controllers/StudyTaskController')
const { authenticateToken } = require('../middleware/auth')
const {
  validatePlanTimeConstraints,
  validateTaskTimeConstraints,
  validateSubTaskTimeConstraints,
  validateTaskUpdateTimeConstraints,
  validatePlanUpdateTimeConstraints
} = require('../middleware/timeConstraints')

// 学习计划相关路由
router.get('/', authenticateToken, studyPlanController.getUserStudyPlans)
router.post('/', authenticateToken, validatePlanTimeConstraints, studyPlanController.createStudyPlan)
router.get('/progress', authenticateToken, studyPlanController.getStudyProgress)
router.get('/:id', authenticateToken, studyPlanController.getStudyPlanById)
router.put('/:id', authenticateToken, validatePlanUpdateTimeConstraints, studyPlanController.updateStudyPlan)
router.delete('/:id', authenticateToken, studyPlanController.deleteStudyPlan)

// 学习任务相关路由
router.post('/tasks', authenticateToken, validateTaskTimeConstraints, studyTaskController.createTask)
router.get('/tasks/:id', authenticateToken, studyTaskController.getTaskById)
router.put('/tasks/:id', authenticateToken, validateTaskUpdateTimeConstraints, studyTaskController.updateTask)
router.patch('/tasks/:id/status', authenticateToken, studyTaskController.updateTaskStatus)
router.delete('/tasks/:id', authenticateToken, studyTaskController.deleteTask)

// 子任务相关路由
router.post('/tasks/:task_id/subtasks', authenticateToken, validateSubTaskTimeConstraints, studyTaskController.addSubTask)
router.put('/subtasks/:subtask_id', authenticateToken, validateSubTaskTimeConstraints, studyTaskController.updateSubTask)
router.delete('/subtasks/:subtask_id', authenticateToken, studyTaskController.deleteSubTask)
router.patch('/tasks/:task_id/subtasks/order', authenticateToken, studyTaskController.updateSubTasksOrder)
router.get('/tasks/:task_id/subtasks/stats', authenticateToken, studyTaskController.getSubTaskStats)

module.exports = router