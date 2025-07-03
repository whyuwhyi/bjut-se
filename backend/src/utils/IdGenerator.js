const crypto = require('crypto')

/**
 * 统一的ID生成器工具类
 * 提供多种ID生成策略，确保唯一性和安全性
 */
class IdGenerator {
  constructor() {
    // 雪花算法相关参数
    this.epoch = 1640995200000 // 2022-01-01 00:00:00 UTC 作为起始时间
    this.machineId = parseInt(process.env.MACHINE_ID || '1') % 1024 // 10位机器ID
    this.sequence = 0 // 12位序列号
    this.lastTimestamp = -1
  }

  /**
   * 生成雪花算法ID（19位数字）
   * 结构：41位时间戳 + 10位机器ID + 12位序列号
   * @returns {string} 19位数字字符串
   */
  generateSnowflakeId() {
    let timestamp = Date.now()

    // 如果当前时间小于上次ID生成的时间，说明系统时钟回退过，抛出异常
    if (timestamp < this.lastTimestamp) {
      throw new Error('时钟回退，拒绝生成ID')
    }

    // 如果是同一毫秒生成的，则进行毫秒内序列
    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1) & 4095 // 12位序列号，最大4095
      // 毫秒内序列溢出
      if (this.sequence === 0) {
        // 阻塞到下一个毫秒，获得新的时间戳
        timestamp = this.tilNextMillis(this.lastTimestamp)
      }
    } else {
      // 时间戳改变，毫秒内序列重置
      this.sequence = 0
    }

    // 上次生成ID的时间截
    this.lastTimestamp = timestamp

    // 移位并通过或运算拼到一起组成64位的ID
    const timestampBits = (timestamp - this.epoch).toString(2).padStart(41, '0')
    const machineIdBits = this.machineId.toString(2).padStart(10, '0')
    const sequenceBits = this.sequence.toString(2).padStart(12, '0')
    
    const binaryId = timestampBits + machineIdBits + sequenceBits
    const id = parseInt(binaryId, 2).toString()
    
    return id
  }

  /**
   * 等待到下一毫秒
   * @param {number} lastTimestamp 上次生成ID的时间戳
   * @returns {number} 新的时间戳
   */
  tilNextMillis(lastTimestamp) {
    let timestamp = Date.now()
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now()
    }
    return timestamp
  }

  /**
   * 生成指定长度的数字ID（兼容现有格式）
   * 使用加密安全的随机数 + 时间戳确保唯一性
   * @param {number} length ID长度，默认9位
   * @returns {string} 指定长度的数字字符串
   */
  generateNumericId(length = 9) {
    if (length < 6 || length > 18) {
      throw new Error('ID长度必须在6-18位之间')
    }

    // 使用时间戳的后几位 + 加密安全随机数
    const timestamp = Date.now().toString()
    const timestampPart = timestamp.slice(-Math.floor(length / 2))
    const randomLength = length - timestampPart.length
    
    // 生成加密安全的随机数
    const randomBytes = crypto.randomBytes(Math.ceil(randomLength / 2))
    const randomPart = randomBytes.toString('hex').slice(0, randomLength)
    
    // 将随机字符转换为数字
    const randomNumbers = randomPart.split('').map(char => {
      const code = char.charCodeAt(0)
      return (code % 10).toString()
    }).join('')

    const id = timestampPart + randomNumbers
    
    // 确保长度正确
    return id.slice(0, length).padStart(length, '0')
  }

  /**
   * 生成UUID v4
   * @returns {string} 标准UUID格式
   */
  generateUUID() {
    return crypto.randomUUID()
  }

  /**
   * 生成短UUID（去掉连字符）
   * @returns {string} 32位十六进制字符串
   */
  generateShortUUID() {
    return crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * 生成文件名ID
   * @param {string} originalName 原始文件名
   * @param {string} extension 文件扩展名（可选）
   * @returns {string} 文件名ID
   */
  generateFileId(originalName = '', extension = '') {
    const timestamp = Date.now()
    const randomPart = crypto.randomBytes(4).toString('hex')
    
    // 清理原始文件名，只保留字母数字
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
    
    if (extension && !extension.startsWith('.')) {
      extension = '.' + extension
    }
    
    return `${timestamp}_${randomPart}_${cleanName}${extension}`
  }

  /**
   * 生成验证码
   * @param {number} length 验证码长度，默认6位
   * @returns {string} 数字验证码
   */
  generateVerificationCode(length = 6) {
    if (length < 4 || length > 8) {
      throw new Error('验证码长度必须在4-8位之间')
    }

    const max = Math.pow(10, length) - 1
    const min = Math.pow(10, length - 1)
    
    // 使用加密安全的随机数
    const randomBytes = crypto.randomBytes(4)
    const randomValue = randomBytes.readUInt32BE(0)
    const code = (randomValue % (max - min + 1)) + min
    
    return code.toString().padStart(length, '0')
  }

  /**
   * 生成帖子ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generatePostId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成标签ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateTagId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成资源ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateResourceId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成任务ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateTaskId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成计划ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generatePlanId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成通知ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateNotificationId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成收藏ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateCollectionId() {
    return this.generateNumericId(9)
  }

  /**
   * 生成关注ID（兼容现有格式）
   * @returns {string} 9位数字ID
   */
  generateFollowId() {
    return this.generateNumericId(9)
  }
}

// 创建单例实例
const idGenerator = new IdGenerator()

module.exports = idGenerator