const { StudyTask, SubTask, StudyPlan, StudyRecord } = require('../models')

// 创建学习任务
const createTask = async (req, res) => {
  try {
    const { phone_number } = req.user
    const { plan_id, title, description, deadline, priority, estimated_hours, tags } = req.body

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
    const task_id = Date.now().toString().slice(-9)

    const task = await StudyTask.create({
      task_id,
      plan_id,
      title,
      description,
      deadline,
      priority: priority || 'medium',
      estimated_hours,
      tags: tags ? JSON.stringify(tags) : null,
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

    // 解析标签
    const taskData = task.toJSON()
    if (taskData.tags) {
      try {
        taskData.tags = JSON.parse(taskData.tags)
      } catch (e) {
        taskData.tags = []
      }
    } else {
      taskData.tags = []
    }

    res.json({
      success: true,
      data: taskData
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

    // 如果任务完成，记录学习活动
    if (status === 'completed') {
      await StudyRecord.create({
        user_phone: phone_number,
        plan_id: task.plan_id,
        task_id: id,
        activity_type: 'task_complete',
        duration_minutes: (actual_hours || 0) * 60,
        experience_gained: 20,
        study_date: new Date()
      })
    }

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

    // 处理标签数据
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags)
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
    const { title, sort_order } = req.body

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

    const subtask = await SubTask.create({
      task_id,
      title,
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

// 更新子任务状态
const updateSubTask = async (req, res) => {
  try {
    const { subtask_id } = req.params
    const { phone_number } = req.user
    const { completed, title } = req.body

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

    const updateData = {}
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title

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

module.exports = {
  createTask,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask,
  addSubTask,
  updateSubTask,
  deleteSubTask
}