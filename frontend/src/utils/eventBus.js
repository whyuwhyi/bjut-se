/**
 * 全局事件总线
 * 用于组件间通信和数据同步
 */

class EventBus {
	constructor() {
		this.events = {}
	}

	// 监听事件
	on(event, callback) {
		if (!this.events[event]) {
			this.events[event] = []
		}
		this.events[event].push(callback)
	}

	// 取消监听
	off(event, callback) {
		if (!this.events[event]) return
		
		if (callback) {
			const index = this.events[event].indexOf(callback)
			if (index > -1) {
				this.events[event].splice(index, 1)
			}
		} else {
			// 如果没有提供回调函数，清空该事件的所有监听
			this.events[event] = []
		}
	}

	// 触发事件
	emit(event, data) {
		if (!this.events[event]) return
		
		this.events[event].forEach(callback => {
			try {
				callback(data)
			} catch (error) {
				console.error(`Event callback error for ${event}:`, error)
			}
		})
	}

	// 只监听一次
	once(event, callback) {
		const onceCallback = (data) => {
			callback(data)
			this.off(event, onceCallback)
		}
		this.on(event, onceCallback)
	}

	// 清空所有事件监听
	clear() {
		this.events = {}
	}
}

// 创建全局实例
const eventBus = new EventBus()

// 定义事件类型常量
export const EVENTS = {
	// 资源相关事件
	RESOURCE_FAVORITE_CHANGED: 'resource_favorite_changed',
	RESOURCE_DOWNLOAD_CHANGED: 'resource_download_changed',
	RESOURCE_VIEW_CHANGED: 'resource_view_changed',
	RESOURCE_RATING_CHANGED: 'resource_rating_changed',
	
	// 帖子相关事件
	POST_LIKE_CHANGED: 'post_like_changed',
	POST_FAVORITE_CHANGED: 'post_favorite_changed',
	POST_VIEW_CHANGED: 'post_view_changed',
	POST_COMMENT_CHANGED: 'post_comment_changed',
	
	// 用户相关事件
	USER_LOGIN: 'user_login',
	USER_LOGOUT: 'user_logout',
	USER_PROFILE_UPDATED: 'user_profile_updated'
}

export default eventBus