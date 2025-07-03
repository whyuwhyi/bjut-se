// 用户相关工具函数

/**
 * 跳转到用户详情页面
 * @param {string} userPhone - 用户手机号
 * @param {object} userInfo - 可选的用户信息对象，包含name等
 */
export function navigateToUserProfile(userPhone, userInfo = {}) {
	if (!userPhone) {
		console.error('用户手机号不能为空')
		return
	}
	
	// 检查是否是当前用户自己
	const currentUserPhone = uni.getStorageSync('userPhone') || uni.getStorageSync('currentUserPhone')
	if (currentUserPhone === userPhone) {
		// 跳转到自己的个人主页
		uni.switchTab({
			url: '/pages/profile/profile'
		})
		return
	}
	
	// 跳转到其他用户的详情页面
	uni.navigateTo({
		url: `/pages/profile/user-detail?phone=${userPhone}`
	})
}

/**
 * 显示用户名称（优先显示真实姓名，其次昵称）
 * @param {object} user - 用户对象
 * @returns {string} 显示的用户名称
 */
export function getUserDisplayName(user) {
	if (!user) return '用户'
	return user.name || user.nickname || '用户'
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(dateString) {
	if (!dateString) return ''
	const date = new Date(dateString)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * 格式化相对时间（几分钟前、几小时前等）
 * @param {string} dateString - 日期字符串
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(dateString) {
	if (!dateString) return ''
	
	const date = new Date(dateString)
	const now = new Date()
	const diff = now - date
	
	const minutes = Math.floor(diff / (1000 * 60))
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	
	if (minutes < 1) {
		return '刚刚'
	} else if (minutes < 60) {
		return `${minutes}分钟前`
	} else if (hours < 24) {
		return `${hours}小时前`
	} else if (days < 7) {
		return `${days}天前`
	} else {
		return formatDate(dateString)
	}
}