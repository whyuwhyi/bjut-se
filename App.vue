<template>
	<view id="app">
		<!-- 全局组件和逻辑 -->
	</view>
</template>

<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 初始化云开发环境
			if (!wx.cloud) {
				console.error('请使用 2.2.3 或以上的基础库以使用云能力')
			} else {
				wx.cloud.init({
					env: 'your-env-id', // 替换为您的云开发环境ID
					traceUser: true,
				})
			}
			
			// 检查用户登录状态
			this.checkLoginStatus()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 检查登录状态
			checkLoginStatus() {
				const userInfo = uni.getStorageSync('userInfo')
				if (!userInfo) {
					// 如果未登录，跳转到登录页面
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}
			}
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "static/css/common.scss";
	
	#app {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}
	
	/* 全局样式 */
	page {
		background-color: #f8f8f8;
		font-size: 28rpx;
		line-height: 1.6;
	}
	
	/* 通用按钮样式 */
	.btn-primary {
		background-color: #007aff;
		color: white;
		border-radius: 8rpx;
		padding: 20rpx 40rpx;
		border: none;
		font-size: 28rpx;
	}
	
	.btn-secondary {
		background-color: #f8f8f8;
		color: #333;
		border: 2rpx solid #ddd;
		border-radius: 8rpx;
		padding: 20rpx 40rpx;
		font-size: 28rpx;
	}
	
	/* 卡片样式 */
	.card {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
	}
	
	/* 列表项样式 */
	.list-item {
		background: white;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		display: flex;
		align-items: center;
	}
	
	.list-item:last-child {
		border-bottom: none;
	}
</style>