const { sequelize } = require('../models')

// 测试前设置
beforeAll(async () => {
  // 设置测试环境
  process.env.NODE_ENV = 'test'
  
  // 连接测试数据库
  await sequelize.authenticate()
  
  // 同步数据库表结构
  await sequelize.sync({ force: true })
})

// 每个测试后清理
afterEach(async () => {
  // 清理所有表数据，但保留表结构
  const models = Object.keys(sequelize.models)
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true
    })
  }
})

// 测试结束后关闭连接
afterAll(async () => {
  await sequelize.close()
})