const { body } = require('express-validator')

const validators = {
  // 用户注册验证
  validateRegister: [
    body('phone_number')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确'),
    body('password')
      .isLength({ min: 6, max: 32 })
      .withMessage('密码长度必须在6-32位之间'),
    body('name')
      .isLength({ min: 1, max: 50 })
      .withMessage('姓名长度必须在1-50个字符之间'),
    body('student_id')
      .optional()
      .matches(/^(\d{8}|S\d{9})$/)
      .withMessage('学号格式不正确'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('邮箱格式不正确')
  ],

  // 用户登录验证
  validateLogin: [
    body('phone_number')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
  ],

  // 更新用户信息验证
  validateUpdateProfile: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('姓名长度必须在1-50个字符之间'),
    body('nickname')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('昵称长度必须在1-50个字符之间'),
    body('student_id')
      .optional()
      .matches(/^(\d{8}|S\d{9})$/)
      .withMessage('学号格式不正确'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('邮箱格式不正确')
  ],

  // 资源创建验证
  validateCreateResource: [
    body('resource_name')
      .isLength({ min: 1, max: 100 })
      .withMessage('资源名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('描述长度不能超过5000个字符')
  ],

  // 活动创建验证
  validateCreateActivity: [
    body('activity_name')
      .isLength({ min: 1, max: 200 })
      .withMessage('活动名称长度必须在1-200个字符之间'),
    body('activity_address')
      .optional()
      .isLength({ max: 300 })
      .withMessage('活动地点长度不能超过300个字符'),
    body('activity_description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('活动描述长度不能超过5000个字符'),
    body('registration_fee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('报名费用必须大于等于0'),
    body('max_participants')
      .optional()
      .isInt({ min: 1, max: 9999 })
      .withMessage('最大参与人数必须在1-9999之间'),
    body('start_time')
      .optional()
      .isISO8601()
      .withMessage('开始时间格式不正确'),
    body('end_time')
      .optional()
      .isISO8601()
      .withMessage('结束时间格式不正确'),
    body('registration_deadline')
      .optional()
      .isISO8601()
      .withMessage('报名截止时间格式不正确')
  ]
}

module.exports = validators