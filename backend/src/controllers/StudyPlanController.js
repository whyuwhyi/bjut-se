const { StudyPlan, StudyTask, SubTask, StudyRecord, User } = require('../models')
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

    // 记录学习活动
    await StudyRecord.create({
      user_phone: phone_number,
      plan_id,
      activity_type: 'plan_create',
      duration_minutes: 0,
      experience_gained: 15,
      study_date: new Date()
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

    const records = await StudyRecord.findAll({
      where: {
        user_phone: phone_number,
        study_date: {
          [Op.gte]: startDate
        }
      },
      order: [['study_date', 'ASC']]
    })

    // 按日期分组统计
    const dailyStats = {}
    const currentDate = new Date(startDate)
    
    while (currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dailyStats[dateStr] = {
        date: dateStr,
        minutes: 0,
        activities: 0,
        experience: 0
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    records.forEach(record => {
      const dateStr = record.study_date
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].minutes += record.duration_minutes
        dailyStats[dateStr].activities += 1
        dailyStats[dateStr].experience += record.experience_gained
      }
    })

    res.json({
      success: true,
      data: {
        period,
        daily_stats: Object.values(dailyStats),
        total_minutes: records.reduce((sum, r) => sum + r.duration_minutes, 0),
        total_activities: records.length,
        total_experience: records.reduce((sum, r) => sum + r.experience_gained, 0)
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