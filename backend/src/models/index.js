const { sequelize } = require('../config/database')

// 导入所有模型
const User = require('./User')
const Resource = require('./Resource')
const ResourceType = require('./ResourceType')
const Activity = require('./Activity')

// 设置模型关系
// 用户 - 资源关系
User.hasMany(Resource, {
  foreignKey: 'publisher_phone',
  sourceKey: 'phone_number',
  as: 'publishedResources'
})
Resource.belongsTo(User, {
  foreignKey: 'publisher_phone',
  targetKey: 'phone_number',
  as: 'publisher'
})

// 用户 - 活动关系
User.hasMany(Activity, {
  foreignKey: 'publisher_phone',
  sourceKey: 'phone_number',
  as: 'publishedActivities'
})
Activity.belongsTo(User, {
  foreignKey: 'publisher_phone',
  targetKey: 'phone_number',
  as: 'publisher'
})

// 资源类型关系（通过中间表）
// 这里需要创建ResourceTypeRelation中间模型，暂时省略
// ResourceType.belongsToMany(Resource, { through: 'ResourceTypeRelations' })
// Resource.belongsToMany(ResourceType, { through: 'ResourceTypeRelations' })

const models = {
  User,
  Resource,
  ResourceType,
  Activity,
  sequelize
}

module.exports = models