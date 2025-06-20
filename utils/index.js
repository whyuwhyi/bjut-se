// 通用工具函数

/**
 * 格式化时间
 * @param {Date|string|number} time 时间
 * @param {string} format 格式 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(time, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!time) return ''
  
  const date = new Date(time)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 相对时间格式化
 * @param {Date|string|number} time 时间
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(time) {
  if (!time) return ''
  
  const now = new Date()
  const date = new Date(time)
  const diff = now - date
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, wait) {
  let previous = 0
  return function (...args) {
    const now = Date.now()
    const context = this
    if (now - previous >= wait) {
      func.apply(context, args)
      previous = now
    }
  }
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj)
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const copy = {}
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key])
    })
    return copy
  }
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * 验证手机号格式
 * @param {string} phone 手机号
 * @returns {boolean} 是否为有效手机号
 */
export function validatePhone(phone) {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 验证学号/工号格式
 * @param {string} id 学号或工号
 * @returns {boolean} 是否为有效格式
 */
export function validateStudentId(id) {
  // 假设学号为8-12位数字
  const re = /^\d{8,12}$/
  return re.test(id)
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string} 文件扩展名
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

/**
 * 获取文件类型图标
 * @param {string} fileType 文件类型
 * @returns {string} 图标路径
 */
export function getFileIcon(fileType) {
  const iconMap = {
    'pdf': '/static/icons/pdf.png',
    'doc': '/static/icons/doc.png',
    'docx': '/static/icons/doc.png',
    'ppt': '/static/icons/ppt.png',
    'pptx': '/static/icons/ppt.png',
    'xls': '/static/icons/excel.png',
    'xlsx': '/static/icons/excel.png',
    'zip': '/static/icons/zip.png',
    'rar': '/static/icons/zip.png',
    '7z': '/static/icons/zip.png',
    'jpg': '/static/icons/image.png',
    'jpeg': '/static/icons/image.png',
    'png': '/static/icons/image.png',
    'gif': '/static/icons/image.png',
    'bmp': '/static/icons/image.png',
    'mp4': '/static/icons/video.png',
    'avi': '/static/icons/video.png',
    'mov': '/static/icons/video.png',
    'wmv': '/static/icons/video.png',
    'mp3': '/static/icons/audio.png',
    'wav': '/static/icons/audio.png',
    'txt': '/static/icons/text.png',
    'md': '/static/icons/text.png'
  }
  return iconMap[fileType] || '/static/icons/file.png'
}

/**
 * 生成随机字符串
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 检查字符串是否为空
 * @param {string} str 字符串
 * @returns {boolean} 是否为空
 */
export function isEmpty(str) {
  return !str || str.trim() === ''
}

/**
 * 截取字符串
 * @param {string} str 原字符串
 * @param {number} length 截取长度
 * @param {string} suffix 后缀
 * @returns {string} 截取后的字符串
 */
export function truncateString(str, length, suffix = '...') {
  if (!str || str.length <= length) {
    return str
  }
  return str.substring(0, length) + suffix
}

/**
 * 将对象转换为查询字符串
 * @param {Object} obj 对象
 * @returns {string} 查询字符串
 */
export function objectToQueryString(obj) {
  const params = new URLSearchParams()
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      params.append(key, obj[key])
    }
  })
  return params.toString()
}

/**
 * 将查询字符串转换为对象
 * @param {string} queryString 查询字符串
 * @returns {Object} 对象
 */
export function queryStringToObject(queryString) {
  const params = new URLSearchParams(queryString)
  const obj = {}
  for (let [key, value] of params) {
    obj[key] = value
  }
  return obj
}

/**
 * 下载文件
 * @param {string} url 文件URL
 * @param {string} filename 文件名
 */
export function downloadFile(url, filename) {
  uni.downloadFile({
    url: url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: (saveRes) => {
            uni.showToast({
              title: '下载成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.error('保存文件失败:', err)
            uni.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      } else {
        uni.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      console.error('下载失败:', err)
      uni.showToast({
        title: '下载失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 */
export function copyToClipboard(text) {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('复制失败:', err)
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 获取系统信息
 * @returns {Promise} 系统信息
 */
export function getSystemInfo() {
  return new Promise((resolve, reject) => {
    uni.getSystemInfo({
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 获取网络状态
 * @returns {Promise} 网络状态
 */
export function getNetworkType() {
  return new Promise((resolve, reject) => {
    uni.getNetworkType({
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 振动反馈
 * @param {string} type 振动类型 'short' | 'long'
 */
export function vibrateShort(type = 'short') {
  if (type === 'long') {
    uni.vibrateLong()
  } else {
    uni.vibrateShort()
  }
}