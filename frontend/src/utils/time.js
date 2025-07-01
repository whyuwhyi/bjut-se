// 时间格式化工具函数

/**
 * 格式化时间为相对时间显示
 * @param {string|Date} time - 时间字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(time) {
    if (!time) return '未知时间'
    
    // 处理时间字符串，确保正确解析
    let date
    if (typeof time === 'string') {
        // 如果时间字符串不包含时区信息，MySQL返回的是服务器本地时间(+08:00)
        // 直接创建Date对象会按本地时区解析
        date = new Date(time)
    } else {
        date = new Date(time)
    }
    
    if (isNaN(date.getTime())) {
        return '时间格式错误'
    }
    
    // 使用本地时间计算差值
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const day = 24 * 60 * 60 * 1000
    
    if (diff < 0) {
        // 如果时间是未来时间，直接显示格式化时间
        return date.toLocaleString('zh-CN')
    } else if (diff < 60 * 1000) {
        return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000))
        return `${minutes}分钟前`
    } else if (diff < day) {
        const hours = Math.floor(diff / (60 * 60 * 1000))
        return `${hours}小时前`
    } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`
    } else {
        return date.toLocaleDateString('zh-CN')
    }
}

/**
 * 格式化时间为完整的本地时间字符串
 * @param {string|Date} time - 时间字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatFullTime(time) {
    if (!time) return '未知时间'
    
    const date = new Date(time)
    if (isNaN(date.getTime())) {
        return '时间格式错误'
    }
    
    return date.toLocaleString('zh-CN')
}

/**
 * 格式化时间为日期字符串
 * @param {string|Date} time - 时间字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(time) {
    if (!time) return '未知日期'
    
    const date = new Date(time)
    if (isNaN(date.getTime())) {
        return '日期格式错误'
    }
    
    return date.toLocaleDateString('zh-CN')
}