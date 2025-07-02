const { StudyPlan, StudyTask, SubTask } = require('../models')

/**
 * 层级化时间约束验证中间件
 * 
 * 时间约束规则：
 * 1. 计划级：结束时间 >= 当前时间（严格约束）
 * 2. 任务级：时间范围必须在计划时间内（范围约束）
 * 3. 子任务级：时间范围必须在任务时间内（范围约束）
 */

/**
 * 验证计划时间约束
 * 计划的结束时间必须大于等于当前时间
 */
const validatePlanTimeConstraints = (req, res, next) => {
  try {
    const { end_date } = req.body
    
    if (end_date) {
      const endDate = new Date(end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 重置到当天开始时间
      
      if (endDate < today) {
        return res.status(400).json({
          success: false,
          message: '计划结束时间不能早于当前日期',
          errorCode: 'PLAN_END_DATE_INVALID'
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('计划时间约束验证失败:', error)
    res.status(500).json({
      success: false,
      message: '时间约束验证失败',
      error: error.message
    })
  }
}

/**
 * 验证任务时间约束
 * 任务的时间范围必须在其所属计划的时间范围内
 */
const validateTaskTimeConstraints = async (req, res, next) => {
  try {
    const { plan_id, deadline } = req.body
    const { phone_number } = req.user
    
    if (deadline && plan_id) {
      // 获取计划信息
      const plan = await StudyPlan.findOne({
        where: {
          plan_id,
          user_phone: phone_number
        }
      })
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: '关联的学习计划不存在'
        })
      }
      
      const taskDeadline = new Date(deadline)
      const planEndDate = new Date(plan.end_date)
      const planStartDate = new Date(plan.start_date)
      
      // 任务截止日期不能早于计划开始时间
      if (taskDeadline < planStartDate) {
        return res.status(400).json({
          success: false,
          message: `任务截止日期不能早于计划开始日期 ${plan.start_date.split('T')[0]}`,
          errorCode: 'TASK_DEADLINE_BEFORE_PLAN_START'
        })
      }
      
      // 任务截止日期不能晚于计划结束时间
      if (taskDeadline > planEndDate) {
        return res.status(400).json({
          success: false,
          message: `任务截止日期不能晚于计划结束日期 ${plan.end_date.split('T')[0]}`,
          errorCode: 'TASK_DEADLINE_AFTER_PLAN_END'
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('任务时间约束验证失败:', error)
    res.status(500).json({
      success: false,
      message: '时间约束验证失败',
      error: error.message
    })
  }
}

/**
 * 验证子任务时间约束
 * 子任务的时间范围必须在其所属任务的时间范围内
 */
const validateSubTaskTimeConstraints = async (req, res, next) => {
  try {
    const { task_id } = req.params
    const { deadline } = req.body
    const { phone_number } = req.user
    
    if (deadline && task_id) {
      // 获取任务信息（包括关联的计划）
      const task = await StudyTask.findOne({
        where: { task_id },
        include: [
          {
            model: StudyPlan,
            as: 'plan',
            where: { user_phone: phone_number }
          }
        ]
      })
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '关联的学习任务不存在'
        })
      }
      
      const subtaskDeadline = new Date(deadline)
      const taskDeadline = new Date(task.deadline)
      const planStartDate = new Date(task.plan.start_date)
      
      // 子任务截止日期不能早于计划开始时间
      if (subtaskDeadline < planStartDate) {
        return res.status(400).json({
          success: false,
          message: `子任务截止日期不能早于计划开始日期 ${task.plan.start_date.split('T')[0]}`,
          errorCode: 'SUBTASK_DEADLINE_BEFORE_PLAN_START'
        })
      }
      
      // 子任务截止日期不能晚于任务截止日期
      if (subtaskDeadline > taskDeadline) {
        return res.status(400).json({
          success: false,
          message: `子任务截止日期不能晚于任务截止日期 ${task.deadline.split('T')[0]}`,
          errorCode: 'SUBTASK_DEADLINE_AFTER_TASK_END'
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('子任务时间约束验证失败:', error)
    res.status(500).json({
      success: false,
      message: '时间约束验证失败',
      error: error.message
    })
  }
}

/**
 * 更新现有任务时验证时间约束
 * 需要考虑现有子任务的时间约束
 */
const validateTaskUpdateTimeConstraints = async (req, res, next) => {
  try {
    const { id } = req.params
    const { deadline } = req.body
    const { phone_number } = req.user
    
    if (deadline) {
      // 获取任务及其子任务
      const task = await StudyTask.findOne({
        where: { task_id: id },
        include: [
          {
            model: StudyPlan,
            as: 'plan',
            where: { user_phone: phone_number }
          },
          {
            model: SubTask,
            as: 'subtasks'
          }
        ]
      })
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '学习任务不存在'
        })
      }
      
      const newTaskDeadline = new Date(deadline)
      const planEndDate = new Date(task.plan.end_date)
      const planStartDate = new Date(task.plan.start_date)
      
      // 验证任务时间在计划范围内
      if (newTaskDeadline < planStartDate || newTaskDeadline > planEndDate) {
        return res.status(400).json({
          success: false,
          message: `任务截止日期必须在计划时间范围内 (${task.plan.start_date.split('T')[0]} ~ ${task.plan.end_date.split('T')[0]})`,
          errorCode: 'TASK_DEADLINE_OUT_OF_PLAN_RANGE'
        })
      }
      
      // 检查是否有子任务的截止日期晚于新的任务截止日期
      const conflictingSubtasks = task.subtasks.filter(subtask => {
        if (!subtask.deadline) return false
        const subtaskDeadline = new Date(subtask.deadline)
        return subtaskDeadline > newTaskDeadline
      })
      
      if (conflictingSubtasks.length > 0) {
        const conflictList = conflictingSubtasks.map(st => 
          `"${st.title}" (${st.deadline.split('T')[0]})`
        ).join(', ')
        
        return res.status(400).json({
          success: false,
          message: `以下子任务的截止日期晚于新的任务截止日期：${conflictList}`,
          errorCode: 'SUBTASKS_DEADLINE_CONFLICT',
          conflictingSubtasks: conflictingSubtasks.map(st => ({
            id: st.subtask_id,
            title: st.title,
            deadline: st.deadline
          }))
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('任务更新时间约束验证失败:', error)
    res.status(500).json({
      success: false,
      message: '时间约束验证失败',
      error: error.message
    })
  }
}

/**
 * 更新现有计划时验证时间约束
 * 需要考虑现有任务和子任务的时间约束
 */
const validatePlanUpdateTimeConstraints = async (req, res, next) => {
  try {
    const { id } = req.params
    const { start_date, end_date } = req.body
    const { phone_number } = req.user
    
    if (start_date || end_date) {
      // 获取计划及其任务和子任务
      const plan = await StudyPlan.findOne({
        where: {
          plan_id: id,
          user_phone: phone_number
        },
        include: [
          {
            model: StudyTask,
            as: 'tasks',
            include: [
              {
                model: SubTask,
                as: 'subtasks'
              }
            ]
          }
        ]
      })
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: '学习计划不存在'
        })
      }
      
      const newStartDate = new Date(start_date || plan.start_date)
      const newEndDate = new Date(end_date || plan.end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 验证计划结束时间不能早于当前时间
      if (newEndDate < today) {
        return res.status(400).json({
          success: false,
          message: '计划结束时间不能早于当前日期',
          errorCode: 'PLAN_END_DATE_BEFORE_TODAY'
        })
      }
      
      // 验证开始时间不能晚于结束时间
      if (newStartDate > newEndDate) {
        return res.status(400).json({
          success: false,
          message: '计划开始时间不能晚于结束时间',
          errorCode: 'PLAN_START_AFTER_END'
        })
      }
      
      // 检查任务时间冲突
      const conflictingTasks = plan.tasks.filter(task => {
        if (!task.deadline) return false
        const taskDeadline = new Date(task.deadline)
        return taskDeadline < newStartDate || taskDeadline > newEndDate
      })
      
      if (conflictingTasks.length > 0) {
        const conflictList = conflictingTasks.map(task => 
          `"${task.title}" (${task.deadline.split('T')[0]})`
        ).join(', ')
        
        return res.status(400).json({
          success: false,
          message: `以下任务的时间超出了新的计划时间范围：${conflictList}`,
          errorCode: 'TASKS_TIME_CONFLICT',
          conflictingTasks: conflictingTasks.map(task => ({
            id: task.task_id,
            title: task.title,
            deadline: task.deadline
          }))
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('计划更新时间约束验证失败:', error)
    res.status(500).json({
      success: false,
      message: '时间约束验证失败',
      error: error.message
    })
  }
}

/**
 * 通用时间约束验证工具函数
 */
const validateTimeRange = (startDate, endDate, label = '时间范围') => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start > end) {
    throw new Error(`${label}：开始时间不能晚于结束时间`)
  }
  
  return true
}

/**
 * 检查日期是否在指定范围内
 */
const isDateInRange = (targetDate, startDate, endDate) => {
  const target = new Date(targetDate)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return target >= start && target <= end
}

/**
 * 格式化错误响应
 */
const formatTimeConstraintError = (message, errorCode, additionalData = {}) => {
  return {
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    ...additionalData
  }
}

module.exports = {
  validatePlanTimeConstraints,
  validateTaskTimeConstraints,
  validateSubTaskTimeConstraints,
  validateTaskUpdateTimeConstraints,
  validatePlanUpdateTimeConstraints,
  validateTimeRange,
  isDateInRange,
  formatTimeConstraintError
}