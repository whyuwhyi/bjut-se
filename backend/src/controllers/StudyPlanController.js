const { StudyPlan, StudyTask, SubTask, User } = require('../models')
const { Op } = require('sequelize')

// 获取用户的学习计划列表
const getUserStudyPlans = async (req, res) => {
  try {
    const { phone_number } = req.user
    const { page = 1, limit = 10, status } = req.query

    const where = { user_phone: phone_number }
    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit

    const plans = await StudyPlan.findAndCountAll({
      where,
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
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit)
    })

    // 计算每个计划的进度
    const plansWithProgress = plans.rows.map(plan => {
      const planData = plan.toJSON()
      const completedTasks = planData.tasks.filter(task => task.status === 'completed').length
      const totalTasks = planData.tasks.length
      planData.progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // 更新数据库中的进度
      plan.update({ progress_percent: planData.progressPercent })
      
      return planData
    })

    res.json({
      success: true,
      data: {
        plans: plansWithProgress,
        total: plans.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('获取学习计划失败:', error)
    res.status(500).json({
      success: false,
      message: '获取学习计划失败',
      error: error.message
    })
  }
}

// 创建新的学习计划
const createStudyPlan = async (req, res) => {
  try {
    const { phone_number } = req.user
    const { title, description, start_date, end_date, plan_type, priority } = req.body

    // 生成9位数字ID
    const plan_id = Date.now().toString().slice(-9)

    const plan = await StudyPlan.create({
      plan_id,
      user_phone: phone_number,
      title,
      description,
      start_date,
      end_date,
      plan_type: plan_type || '自定义计划',
      priority: priority || 'medium',
      status: 'active',
      progress_percent: 0
    })


    res.json({
      success: true,
      message: '学习计划创建成功',
      data: plan
    })
  } catch (error) {
    console.error('创建学习计划失败:', error)
    res.status(500).json({
      success: false,
      message: '创建学习计划失败',
      error: error.message
    })
  }
}

// 获取学习计划详情
const getStudyPlanById = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user

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
              as: 'subtasks',
              order: [['sort_order', 'ASC']]
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '学习计划不存在'
      })
    }

    res.json({
      success: true,
      data: plan
    })
  } catch (error) {
    console.error('获取学习计划详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取学习计划详情失败',
      error: error.message
    })
  }
}

// 更新学习计划
const updateStudyPlan = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user
    const updateData = req.body

    const plan = await StudyPlan.findOne({
      where: {
        plan_id: id,
        user_phone: phone_number
      }
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '学习计划不存在'
      })
    }

    await plan.update(updateData)

    res.json({
      success: true,
      message: '学习计划更新成功',
      data: plan
    })
  } catch (error) {
    console.error('更新学习计划失败:', error)
    res.status(500).json({
      success: false,
      message: '更新学习计划失败',
      error: error.message
    })
  }
}

// 删除学习计划
const deleteStudyPlan = async (req, res) => {
  try {
    const { id } = req.params
    const { phone_number } = req.user

    const plan = await StudyPlan.findOne({
      where: {
        plan_id: id,
        user_phone: phone_number
      }
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '学习计划不存在'
      })
    }

    await plan.destroy()

    res.json({
      success: true,
      message: '学习计划删除成功'
    })
  } catch (error) {
    console.error('删除学习计划失败:', error)
    res.status(500).json({
      success: false,
      message: '删除学习计划失败',
      error: error.message
    })
  }
}

// 获取学习进度统计
const getStudyProgress = async (req, res) => {
  try {
    const { phone_number } = req.user
    const { period = 'week' } = req.query

    let startDate = new Date()
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (period === 'year') {
      startDate.setDate(startDate.getDate() - 365)
    }

    // 获取用户学习计划统计
    const plans = await StudyPlan.findAll({
      where: {
        user_phone: phone_number,
        created_at: {
          [Op.gte]: startDate
        }
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

    // 统计计划和任务完成情况
    let totalPlans = plans.length
    let completedPlans = plans.filter(p => p.status === 'completed').length
    let totalTasks = 0
    let completedTasks = 0
    let totalSubtasks = 0
    let completedSubtasks = 0

    plans.forEach(plan => {
      if (plan.tasks) {
        totalTasks += plan.tasks.length
        completedTasks += plan.tasks.filter(t => t.status === 'completed').length
        
        plan.tasks.forEach(task => {
          if (task.subtasks) {
            totalSubtasks += task.subtasks.length
            completedSubtasks += task.subtasks.filter(st => st.completed).length
          }
        })
      }
    })

    res.json({
      success: true,
      data: {
        period,
        total_plans: totalPlans,
        completed_plans: completedPlans,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        total_subtasks: totalSubtasks,
        completed_subtasks: completedSubtasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    })
  } catch (error) {
    console.error('获取学习进度失败:', error)
    res.status(500).json({
      success: false,
      message: '获取学习进度失败',
      error: error.message
    })
  }
}

module.exports = {
  getUserStudyPlans,
  createStudyPlan,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  getStudyProgress
}