const { StudyTask, SubTask, StudyPlan } = require('../models')
const idGenerator = require('../utils/IdGenerator')

// 创建学习任务
const createTask = async (req, res) => {
  try {
    const { phone_number } = req.user
    const { plan_id, title, description, deadline, priority, estimated_hours } = req.body

    // 验证学习计划是否存在且属于当前用户
    const plan = await StudyPlan.findOne({
      where: {
        plan_id,
        user_phone: phone_number
      }
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '学习计划不存在'
      })
    }

    // 生成9位数字ID
    const task_id = idGenerator.generateTaskId()

    const task = await StudyTask.create({
      task_id,
      plan_id,
      title,
      description,
      deadline,
      priority: priority || 'medium',
      estimated_hours,
      status: 'pending'
    })

    res.json({
      success: true,
      message: '学习任务创建成功',
      data: task
    })
  } catch (error) {
    console.error('创建学习任务失败:', error)
    res.status(500).json({
      success: false,
      message: '创建学习任务失败',
      error: error.message
    })
  }
}

// 获取任务详情
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user

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
          as: 'subtasks',
          order: [['sort_order', 'ASC']]
        }
      ]
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '学习任务不存在'
      })
    }

    res.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      error: error.message
    })
  }
}

// 更新任务状态
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user
    const { status, actual_hours } = req.body

    const task = await StudyTask.findOne({
      where: { task_id: id },
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
        message: '学习任务不存在'
      })
    }

    const updateData = { status }
    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours
    }

    await task.update(updateData)

    res.json({
      success: true,
      message: '任务状态更新成功',
      data: task
    })
  } catch (error) {
    console.error('更新任务状态失败:', error)
    res.status(500).json({
      success: false,
      message: '更新任务状态失败',
      error: error.message
    })
  }
}

// 更新任务信息
const updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user
    const updateData = req.body

    const task = await StudyTask.findOne({
      where: { task_id: id },
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
        message: '学习任务不存在'
      })
    }

    await task.update(updateData)

    res.json({
      success: true,
      message: '任务更新成功',
      data: task
    })
  } catch (error) {
    console.error('更新任务失败:', error)
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      error: error.message
    })
  }
}

// 删除任务
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user

    const task = await StudyTask.findOne({
      where: { task_id: id },
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
        message: '学习任务不存在'
      })
    }

    await task.destroy()

    res.json({
      success: true,
      message: '任务删除成功'
    })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    })
  }
}

// 添加子任务
const addSubTask = async (req, res) => {
  try {
    const { task_id } = req.params
    const { phone_number } = req.user
    const { title, description, deadline, priority, estimated_minutes, notes, sort_order } = req.body

    // 验证任务是否存在且属于当前用户
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
        message: '学习任务不存在'
      })
    }

    // 时间约束验证：子任务的截止日期必须在任务的时间范围内
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const taskDeadline = new Date(task.deadline)
      
      if (deadlineDate > taskDeadline) {
        return res.status(400).json({
          success: false,
          message: `子任务截止日期不能晚于任务截止日期 ${task.deadline.split('T')[0]}`
        })
      }
    }

    const subtask = await SubTask.create({
      task_id,
      title,
      description,
      deadline,
      priority: priority || 'medium',
      estimated_minutes: estimated_minutes || 0,
      notes,
      sort_order: sort_order || 0,
      completed: false
    })

    res.json({
      success: true,
      message: '子任务创建成功',
      data: subtask
    })
  } catch (error) {
    console.error('创建子任务失败:', error)
    res.status(500).json({
      success: false,
      message: '创建子任务失败',
      error: error.message
    })
  }
}

// 更新子任务
const updateSubTask = async (req, res) => {
  try {
    const { subtask_id } = req.params
    const { phone_number } = req.user
    const { completed, title, description, deadline, priority, estimated_minutes, notes, sort_order } = req.body

    const subtask = await SubTask.findOne({
      where: { subtask_id },
      include: [
        {
          model: StudyTask,
          as: 'task',
          include: [
            {
              model: StudyPlan,
              as: 'plan',
              where: { user_phone: phone_number }
            }
          ]
        }
      ]
    })

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: '子任务不存在'
      })
    }

    // 时间约束验证：如果更新截止日期，必须在任务的时间范围内
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const taskDeadline = new Date(subtask.task.deadline)
      
      if (deadlineDate > taskDeadline) {
        return res.status(400).json({
          success: false,
          message: `子任务截止日期不能晚于任务截止日期 ${subtask.task.deadline.split('T')[0]}`
        })
      }
    }

    const updateData = {}
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (deadline !== undefined) updateData.deadline = deadline
    if (priority !== undefined) updateData.priority = priority
    if (estimated_minutes !== undefined) updateData.estimated_minutes = estimated_minutes
    if (notes !== undefined) updateData.notes = notes
    if (sort_order !== undefined) updateData.sort_order = sort_order

    await subtask.update(updateData)

    res.json({
      success: true,
      message: '子任务更新成功',
      data: subtask
    })
  } catch (error) {
    console.error('更新子任务失败:', error)
    res.status(500).json({
      success: false,
      message: '更新子任务失败',
      error: error.message
    })
  }
}

// 删除子任务
const deleteSubTask = async (req, res) => {
  try {
    const { subtask_id } = req.params
    const { phone_number } = req.user

    const subtask = await SubTask.findOne({
      where: { subtask_id },
      include: [
        {
          model: StudyTask,
          as: 'task',
          include: [
            {
              model: StudyPlan,
              as: 'plan',
              where: { user_phone: phone_number }
            }
          ]
        }
      ]
    })

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: '子任务不存在'
      })
    }

    await subtask.destroy()

    res.json({
      success: true,
      message: '子任务删除成功'
    })
  } catch (error) {
    console.error('删除子任务失败:', error)
    res.status(500).json({
      success: false,
      message: '删除子任务失败',
      error: error.message
    })
  }
}

// 批量更新子任务排序
const updateSubTasksOrder = async (req, res) => {
  try {
    const { task_id } = req.params
    const { phone_number } = req.user
    const { subtasks } = req.body // Array of {subtask_id, sort_order}

    // 验证任务是否存在且属于当前用户
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
        message: '学习任务不存在'
      })
    }

    // 批量更新排序
    const updatePromises = subtasks.map(({ subtask_id, sort_order }) =>
      SubTask.update(
        { sort_order },
        { where: { subtask_id, task_id } }
      )
    )

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: '子任务排序更新成功'
    })
  } catch (error) {
    console.error('更新子任务排序失败:', error)
    res.status(500).json({
      success: false,
      message: '更新子任务排序失败',
      error: error.message
    })
  }
}

// 获取任务的子任务统计信息
const getSubTaskStats = async (req, res) => {
  try {
    const { task_id } = req.params
    const { phone_number } = req.user

    // 验证任务是否存在且属于当前用户
    const task = await StudyTask.findOne({
      where: { task_id },
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

    const subtasks = task.subtasks
    const total = subtasks.length
    const completed = subtasks.filter(st => st.completed).length
    const pending = total - completed

    // 按优先级统计
    const highPriority = subtasks.filter(st => st.priority === 'high').length
    const mediumPriority = subtasks.filter(st => st.priority === 'medium').length
    const lowPriority = subtasks.filter(st => st.priority === 'low').length

    // 计算加权进度（高优先级3倍权重，中优先级2倍权重，低优先级1倍权重）
    let totalWeight = 0
    let completedWeight = 0

    subtasks.forEach(st => {
      const weight = st.priority === 'high' ? 3 : st.priority === 'medium' ? 2 : 1
      totalWeight += weight
      if (st.completed) {
        completedWeight += weight
      }
    })

    const weightedProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0

    // 时间统计
    const totalEstimatedMinutes = subtasks.reduce((sum, st) => sum + (st.estimated_minutes || 0), 0)
    const completedEstimatedMinutes = subtasks
      .filter(st => st.completed)
      .reduce((sum, st) => sum + (st.estimated_minutes || 0), 0)

    // 过期任务统计
    const today = new Date()
    const overdue = subtasks.filter(st => !st.completed && st.deadline && new Date(st.deadline) < today).length

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        overdue,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        weightedProgress,
        priority: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority
        },
        estimatedTime: {
          total: totalEstimatedMinutes,
          completed: completedEstimatedMinutes,
          remaining: totalEstimatedMinutes - completedEstimatedMinutes
        }
      }
    })
  } catch (error) {
    console.error('获取子任务统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取子任务统计失败',
      error: error.message
    })
  }
}

// 时间约束验证工具函数
const validateTimeConstraints = (taskDeadline, subtaskDeadline, planEndDate) => {
  const errors = []
  
  if (subtaskDeadline && taskDeadline) {
    const subtaskDate = new Date(subtaskDeadline)
    const taskDate = new Date(taskDeadline)
    
    if (subtaskDate > taskDate) {
      errors.push(`子任务截止日期不能晚于任务截止日期 ${taskDeadline.split('T')[0]}`)
    }
  }
  
  if (subtaskDeadline && planEndDate) {
    const subtaskDate = new Date(subtaskDeadline)
    const planDate = new Date(planEndDate)
    
    if (subtaskDate > planDate) {
      errors.push(`子任务截止日期不能晚于计划结束日期 ${planEndDate.split('T')[0]}`)
    }
  }
  
  return errors
}

module.exports = {
  createTask,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask,
  addSubTask,
  updateSubTask,
  deleteSubTask,
  updateSubTasksOrder,
  getSubTaskStats,
  validateTimeConstraints
}