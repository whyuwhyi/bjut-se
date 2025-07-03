const { User, Resource, Post, Collection, UserFollow, File, VerificationCode } = require('../models')
const idGenerator = require('../utils/IdGenerator')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const config = require('../config/app')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const twilio = require('twilio');
const { Op } = require('sequelize');


class UserController {
  // 用户注册
  async register(req, res) {
    try {
      // 验证输入
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const { phone_number, password, name, student_id, email } = req.body

      // 检查用户是否已存在
      const existingUser = await User.findByPk(phone_number)
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '用户已存在'
        })
      }

      // 检查学号是否已被使用
      if (student_id) {
        const existingStudent = await User.findOne({
          where: { student_id }
        })
        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: '学号已被使用'
          })
        }
      }

      // 创建用户
      const user = await User.create({
        phone_number,
        password,
        name,
        student_id,
        email
      })

      // 生成JWT token
      const token = jwt.sign(
        { phone_number: user.phone_number },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: user.toSafeJSON(),
          token
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 发送验证码
  async sendVerificationCode(req, res) {
    const { phone_number } = req.body;
    const verificationCode = idGenerator.generateVerificationCode(6); // 生成6位验证码

    try {
      // 发送短信
      await twilio(config.twilio.accountSid, config.twilio.authToken).messages.create({
        to: phone_number,
        from: config.twilio.fromPhone,
        body: `您的验证码是：${verificationCode}`,
      });

      // 计算验证码过期时间（例如5分钟后）
      const expiresIn = new Date(Date.now() + 5 * 60 * 1000);

      // 存储验证码到数据库
      await VerificationCode.create({
        phone_number,
        code: verificationCode,
        expires_at: expiresIn,
        status: 'valid',
      });

      res.json({
        success: true,
        message: '验证码已发送',
      });
    } catch (error) {
      console.error('发送验证码错误:', error);
      res.status(500).json({
        success: false,
        message: '发送验证码失败',
      });
    }
  }

  async verifyCode(req, res) {
    const { phone_number, verification_code } = req.body;

    try {
      // 查找验证码记录
      const record = await VerificationCode.findOne({
        where: {
          phone_number,
          code: verification_code,
          status: 'valid',
          expires_at: {
            [Op.gt]: new Date() // 确保验证码未过期
          },
        }
      });

      if (!record) {
        return res.status(400).json({
          success: false,
          message: '验证码无效或已过期'
        });
      }

      // 验证成功后，更新验证码状态
      await VerificationCode.update(
        { status: 'used' },
        { where: { id: record.id } }
      );

      res.json({
        success: true,
        message: '验证码验证成功'
      });
    } catch (error) {
      console.error('验证验证码错误:', error);
      res.status(500).json({
        success: false,
        message: '验证验证码失败'
      });
    }
  }

  // 用户登录
  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '登录失败：输入数据验证失败',
          errors: errors.array()
        })
      }

      const { phone_number, password } = req.body

      // 查找用户
      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '密码错误'
        })
      }

      // 检查用户状态
      if (user.status !== 'active') {
        let message = '账户无法登录'
        let statusCode = 403
        
        switch (user.status) {
          case 'inactive':
            message = '账户已被停用，请联系管理员重新激活您的账户'
            break
          case 'banned':
            message = '账户已被封禁，如有疑问请联系管理员申诉'
            break
          case 'deleted':
            message = '账户已被删除，无法登录系统'
            statusCode = 410 // Gone
            break
          default:
            message = '账户状态异常，请联系管理员处理'
        }
        
        return res.status(statusCode).json({
          success: false,
          message,
          data: {
            status: user.status,
            contactAdmin: true
          }
        })
      }

      // 生成JWT token
      const token = jwt.sign(
        { phone_number: user.phone_number },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: user.toSafeJSON(),
          token
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取用户信息
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeJSON()
        }
      })
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取其他用户的公开信息
  async getUserProfile(req, res) {
    try {
      const { phone } = req.params
      const currentUserPhone = req.user ? req.user.phone_number : null

      const user = await User.findByPk(phone)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 获取隐私设置
      const privacySettings = user.privacy_settings || {
        show_email: false,
        show_student_id: false,
        show_real_name: true,
        show_bio: true,
        show_stats: true,
        allow_follow: true
      }

      // 构建公开信息对象
      const publicProfile = {
        phone_number: user.phone_number,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }

      // 根据隐私设置添加信息
      if (privacySettings.show_real_name) {
        publicProfile.name = user.name
      }
      
      if (privacySettings.show_bio) {
        publicProfile.bio = user.bio
      }
      
      if (privacySettings.show_stats) {
        publicProfile.resource_count = user.resource_count
        publicProfile.post_count = user.post_count
        publicProfile.follower_count = user.follower_count
        publicProfile.following_count = user.following_count
      }

      // 根据隐私设置决定是否显示敏感信息
      if (privacySettings.show_email) {
        publicProfile.email = user.email
      }
      if (privacySettings.show_student_id) {
        publicProfile.student_id = user.student_id
      }
      
      // 如果是当前用户查看自己，添加隐私设置信息用于前端判断
      if (currentUserPhone === phone) {
        publicProfile.privacy_settings = user.privacy_settings
      }

      // 检查当前用户是否关注了这个用户
      let isFollowing = false
      let canFollow = privacySettings.allow_follow
      
      if (currentUserPhone && currentUserPhone !== phone && canFollow) {
        const followRecord = await UserFollow.findOne({
          where: {
            follower_phone: currentUserPhone,
            following_phone: phone,
            status: 'active'
          }
        })
        isFollowing = !!followRecord
      }

      res.json({
        success: true,
        data: {
          user: publicProfile,
          isFollowing,
          canFollow
        }
      })
    } catch (error) {
      console.error('Get user profile error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 更新用户信息
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const { name, nickname, email, student_id, bio, birthday } = req.body
      const phone_number = req.user.phone_number

      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查学号是否已被其他用户使用
      if (student_id && student_id !== user.student_id) {
        const existingStudent = await User.findOne({
          where: { student_id }
        })
        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: '学号已被使用'
          })
        }
      }

      // 更新用户信息
      await user.update({
        name: name || user.name,
        nickname: nickname || user.nickname,
        email: email || user.email,
        student_id: student_id || user.student_id,
        bio: bio !== undefined ? bio : user.bio,
        birthday: birthday !== undefined ? birthday : user.birthday
      })

      res.json({
        success: true,
        message: '更新成功',
        data: {
          user: user.toSafeJSON()
        }
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 上传头像
  async uploadAvatar(req, res) {
    try {
      const phone_number = req.user.phone_number

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择头像文件'
        })
      }

      // 构建头像访问URL
      const avatar_url = `/uploads/avatars/${req.file.filename}`

      // 更新用户头像
      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      await user.update({ avatar_url })

      res.json({
        success: true,
        message: '头像上传成功',
        data: {
          avatar_url,
          user: user.toSafeJSON()
        }
      })
    } catch (error) {
      console.error('Upload avatar error:', error)
      res.status(500).json({
        success: false,
        message: '头像上传失败'
      })
    }
  }

  // 获取用户发布的资源
  async getUserResources(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query
      const phone_number = req.user.phone_number
      const offset = (page - 1) * limit

      // 构建查询条件
      const where = { publisher_phone: phone_number }
      
      // 如果status参数存在且不为空，则添加状态筛选
      if (status && status !== '' && status !== 'all') {
        where.status = status
      } else {
        // 如果没有指定状态或状态为空/all，则查询所有非删除状态的资源
        where.status = { [Op.in]: ['draft', 'pending', 'published', 'rejected'] }
      }

      const resources = await Resource.findAndCountAll({
        where,
        include: [
          {
            model: File,
            as: 'files',
            attributes: ['file_id', 'file_name', 'file_type', 'file_size']
          }
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit)
      })


      res.json({
        success: true,
        data: {
          resources: resources.rows,
          total: resources.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Get user resources error:', error)
      res.status(500).json({
        success: false,
        message: '获取用户资源失败'
      })
    }
  }

  // 获取用户发布的帖子
  async getUserPosts(req, res) {
    try {
      const { page = 1, limit = 10, status = 'active' } = req.query
      const phone_number = req.user.phone_number
      const offset = (page - 1) * limit

      // 修正：status 为空或 all 时查所有非 deleted 帖子
      const where = { author_phone: phone_number }
      if (status && status !== '' && status !== 'all') {
        where.status = status
      } else {
        where.status = { [Op.in]: ['active', 'hidden'] }
      }

      const posts = await Post.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: {
          posts: posts.rows,
          total: posts.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Get user posts error:', error)
      res.status(500).json({
        success: false,
        message: '获取用户帖子失败'
      })
    }
  }

  // 获取用户收藏
  async getUserCollections(req, res) {
    try {
      const { page = 1, limit = 10, collection_type } = req.query
      const phone_number = req.user.phone_number
      const offset = (page - 1) * limit

      const where = {
        user_phone: phone_number,
        status: 'active'
      }

      if (collection_type) {
        where.collection_type = collection_type
      }

      // Get collections without complex joins first
      const { count, rows: rawCollections } = await Collection.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit)
      })

      // Manually fetch related data for each collection
      const collections = await Promise.all(rawCollections.map(async (collection) => {
        const collectionData = collection.toJSON()
        if (collection.collection_type === 'resource') {
          const resource = await Resource.findOne({
            where: { resource_id: collection.content_id, status: 'published' },
            include: [
              {
                model: User,
                as: 'publisher',
                attributes: ['name', 'nickname']
              }
            ]
          })
          collectionData.resource = resource
          collectionData.post = null
        } else if (collection.collection_type === 'post') {
          const post = await Post.findOne({
            where: { post_id: collection.content_id, status: 'active' },
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['name', 'nickname']
              }
            ]
          })
          collectionData.post = post
          collectionData.resource = null
        }
        return collectionData
      }))

      res.json({
        success: true,
        data: {
          collections: collections,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Get user collections error:', error)
      res.status(500).json({
        success: false,
        message: '获取用户收藏失败'
      })
    }
  }

  // 获取用户关注列表
  async getUserFollowing(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query
      const phone_number = req.user.phone_number
      const offset = (page - 1) * limit

      const following = await UserFollow.findAndCountAll({
        where: {
          follower_phone: phone_number,
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'followingUser',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: {
          following: following.rows,
          total: following.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Get user following error:', error)
      res.status(500).json({
        success: false,
        message: '获取关注列表失败'
      })
    }
  }

  // 获取用户粉丝列表
  async getUserFollowers(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query
      const phone_number = req.user.phone_number
      const offset = (page - 1) * limit

      const followers = await UserFollow.findAndCountAll({
        where: {
          following_phone: phone_number,
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'follower',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: {
          followers: followers.rows,
          total: followers.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Get user followers error:', error)
      res.status(500).json({
        success: false,
        message: '获取粉丝列表失败'
      })
    }
  }

  // 关注/取消关注用户
  async toggleFollow(req, res) {
    try {
      const follower_phone = req.user.phone_number
      const { following_phone } = req.params

      if (follower_phone === following_phone) {
        return res.status(400).json({
          success: false,
          message: '不能关注自己'
        })
      }

      // 检查被关注用户是否存在
      const targetUser = await User.findByPk(following_phone)
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 查找现有关注记录
      const existingFollow = await UserFollow.findOne({
        where: {
          follower_phone,
          following_phone
        }
      })

      let isFollowing = false
      let message = ''

      if (existingFollow) {
        if (existingFollow.status === 'active') {
          // 取消关注
          await existingFollow.update({ status: 'cancelled' })
          // 新增：取关时自减
          await User.decrement('following_count', { where: { phone_number: follower_phone }, min: 0 })
          await User.decrement('follower_count', { where: { phone_number: following_phone }, min: 0 })
          message = '已取消关注'
        } else {
          // 重新关注
          await existingFollow.update({ status: 'active' })
          // 新增：重新关注时自增
          await User.increment('following_count', { where: { phone_number: follower_phone } })
          await User.increment('follower_count', { where: { phone_number: following_phone } })
          isFollowing = true
          message = '关注成功'
        }
      } else {
        // 新关注
        const follow_id = idGenerator.generateFollowId()
        await UserFollow.create({
          follow_id,
          follower_phone,
          following_phone,
          status: 'active'
        })
        // 新增：新关注时自增
        await User.increment('following_count', { where: { phone_number: follower_phone } })
        await User.increment('follower_count', { where: { phone_number: following_phone } })
        isFollowing = true
        message = '关注成功'
      }

      res.json({
        success: true,
        message,
        data: { isFollowing }
      })
    } catch (error) {
      console.error('Toggle follow error:', error)
      res.status(500).json({
        success: false,
        message: '操作失败'
      })
    }
  }

  // 获取用户下载记录

  // 更新用户隐私设置
  async updatePrivacySettings(req, res) {
    try {
      const phone_number = req.user.phone_number
      const { privacy_settings } = req.body

      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 验证隐私设置格式
      const allowedSettings = ['show_email', 'show_student_id', 'show_real_name', 'show_bio', 'show_stats', 'allow_follow']
      const validSettings = {}
      
      for (const key of allowedSettings) {
        if (key in privacy_settings && typeof privacy_settings[key] === 'boolean') {
          validSettings[key] = privacy_settings[key]
        }
      }

      // 合并现有设置和新设置
      const currentSettings = user.privacy_settings || {
        show_email: false,
        show_student_id: false,
        show_real_name: true,
        show_bio: true,
        show_stats: true,
        allow_follow: true
      }

      const newSettings = { ...currentSettings, ...validSettings }

      await user.update({ privacy_settings: newSettings })

      res.json({
        success: true,
        message: '隐私设置更新成功',
        data: {
          privacy_settings: newSettings
        }
      })
    } catch (error) {
      console.error('Update privacy settings error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取用户统计信息
  async getUserStats(req, res) {
    try {
      const phone_number = req.user.phone_number
      
      // 先检查用户是否存在
      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 直接查询数据库获取准确的统计数据
      const [resourceCount, postCount, collectionCount, followingCount, followerCount] = await Promise.all([
        // 资源数：查询已发布的资源
        Resource.count({ 
          where: { 
            publisher_phone: phone_number, 
            status: 'published' 
          } 
        }),
        // 帖子数：查询已发布的帖子
        Post.count({ 
          where: { 
            author_phone: phone_number, 
            status: 'published' 
          } 
        }),
        // 收藏数：查询活跃的收藏
        Collection.count({ 
          where: { 
            user_phone: phone_number, 
            status: 'active' 
          } 
        }),
        // 关注数：查询活跃的关注关系
        UserFollow.count({ 
          where: { 
            follower_phone: phone_number, 
            status: 'active' 
          } 
        }),
        // 粉丝数：查询活跃的被关注关系
        UserFollow.count({ 
          where: { 
            following_phone: phone_number, 
            status: 'active' 
          } 
        })
      ])

      res.json({
        success: true,
        data: {
          resourceCount,
          postCount,
          collectionCount,
          followingCount,
          followerCount
        }
      })
    } catch (error) {
      console.error('Get user stats error:', error)
      res.status(500).json({
        success: false,
        message: '获取统计信息失败'
      })
    }
  }
}

module.exports = new UserController()