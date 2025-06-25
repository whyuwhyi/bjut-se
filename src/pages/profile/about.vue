<template>
	<view class="about-container">
		<!-- 应用信息 -->
		<view class="app-info">
			<image class="app-logo" :src="require('@/static/logo.png')" mode="aspectFit"></image>
			<text class="app-name">日新智链</text>
			<text class="app-version">版本 {{ appVersion }}</text>
			<text class="app-slogan">智慧学习，链接未来</text>
		</view>

		<!-- 应用介绍 -->
		<view class="app-description">
			<text class="section-title">关于应用</text>
			<view class="description-content">
				<text class="description-text">
					日新智链是一款专为大学生打造的智能学习平台，致力于为学生提供优质的学习资源、便捷的学习工具和活跃的学习社区。
				</text>
				<text class="description-text">
					我们相信，通过技术的力量，能够让学习变得更加高效、有趣和富有成效。让每一位学生都能在这里找到属于自己的学习方式。
				</text>
			</view>
		</view>

		<!-- 功能特色 -->
		<view class="features">
			<text class="section-title">功能特色</text>
			<view class="feature-list">
				<view class="feature-item" v-for="(feature, index) in features" :key="index">
					<text class="feature-icon">{{ feature.icon }}</text>
					<view class="feature-info">
						<text class="feature-name">{{ feature.name }}</text>
						<text class="feature-desc">{{ feature.description }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 开发团队 -->
		<view class="team-info">
			<text class="section-title">开发团队</text>
			<view class="team-content">
				<text class="team-name">北京工业大学软件学院</text>
				<text class="team-desc">由一群热爱技术、关注教育的年轻开发者组成</text>
				<view class="team-members">
					<view class="member-item" v-for="(member, index) in teamMembers" :key="index">
						<text class="member-name">{{ member.name }}</text>
						<text class="member-role">{{ member.role }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 联系我们 -->
		<view class="contact-info">
			<text class="section-title">联系我们</text>
			<view class="contact-list">
				<view class="contact-item" @click="copyToClipboard('contact', 'support@bjut-software.edu.cn')">
					<text class="contact-icon">📧</text>
					<view class="contact-info">
						<text class="contact-label">邮箱</text>
						<text class="contact-value">support@bjut-software.edu.cn</text>
					</view>
					<text class="contact-action">复制</text>
				</view>
				
				<view class="contact-item" @click="copyToClipboard('qq', '123456789')">
					<text class="contact-icon">💬</text>
					<view class="contact-info">
						<text class="contact-label">QQ群</text>
						<text class="contact-value">123456789</text>
					</view>
					<text class="contact-action">复制</text>
				</view>
				
				<view class="contact-item" @click="openWebsite()">
					<text class="contact-icon">🌐</text>
					<view class="contact-info">
						<text class="contact-label">官网</text>
						<text class="contact-value">www.bjut-software.edu.cn</text>
					</view>
					<text class="contact-action">访问</text>
				</view>
			</view>
		</view>

		<!-- 法律信息 -->
		<view class="legal-info">
			<text class="section-title">法律信息</text>
			<view class="legal-list">
				<view class="legal-item" @click="openPrivacyPolicy()">
					<text class="legal-text">隐私政策</text>
					<text class="legal-arrow">></text>
				</view>
				<view class="legal-item" @click="openUserAgreement()">
					<text class="legal-text">用户协议</text>
					<text class="legal-arrow">></text>
				</view>
				<view class="legal-item" @click="openOpenSource()">
					<text class="legal-text">开源许可</text>
					<text class="legal-arrow">></text>
				</view>
			</view>
		</view>

		<!-- 版权信息 -->
		<view class="copyright">
			<text class="copyright-text">© 2025 北京工业大学软件学院</text>
			<text class="copyright-text">All Rights Reserved</text>
		</view>

		<!-- 彩蛋区域 -->
		<view class="easter-egg" @click="handleEasterEgg">
			<text class="egg-text">🥚</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			appVersion: '1.0.0',
			easterEggCount: 0,
			features: [
				{
					icon: '📚',
					name: '学习资源',
					description: '海量优质学习资料，涵盖各个专业领域'
				},
				{
					icon: '💬',
					name: '学习社区',
					description: '活跃的讨论氛围，与同学交流学习心得'
				},
				{
					icon: '🎯',
					name: '社团活动',
					description: '丰富的校园活动，拓展课余生活'
				},
				{
					icon: '📊',
					name: '学习分析',
					description: '个性化学习数据分析，助力学习提升'
				},
				{
					icon: '🏆',
					name: '成就系统',
					description: '激励机制让学习更有动力和成就感'
				},
				{
					icon: '🔔',
					name: '智能提醒',
					description: '重要信息及时通知，不错过任何学习机会'
				}
			],
			teamMembers: [
				{ name: '张三', role: '项目负责人' },
				{ name: '李四', role: '前端开发' },
				{ name: '王五', role: '后端开发' },
				{ name: '赵六', role: 'UI设计师' },
				{ name: '钱七', role: '测试工程师' }
			]
		}
	},
	
	onLoad() {
		this.loadAppInfo()
	},
	
	methods: {
		async loadAppInfo() {
			try {
				// 获取应用版本信息
				const systemInfo = uni.getSystemInfoSync()
				console.log('系统信息:', systemInfo)
			} catch (error) {
				console.error('获取应用信息失败:', error)
			}
		},
		
		copyToClipboard(type, content) {
			uni.setClipboardData({
				data: content,
				success: () => {
					const typeNames = {
						'contact': '邮箱地址',
						'qq': 'QQ群号',
						'website': '网址'
					}
					uni.showToast({
						title: `${typeNames[type] || '内容'}已复制`,
						icon: 'success'
					})
				},
				fail: () => {
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					})
				}
			})
		},
		
		openWebsite() {
			uni.showModal({
				title: '跳转提示',
				content: '即将跳转到外部浏览器打开官网',
				success: (res) => {
					if (res.confirm) {
						// 在实际应用中，这里会跳转到浏览器
						uni.showToast({
							title: '正在跳转...',
							icon: 'loading'
						})
					}
				}
			})
		},
		
		openPrivacyPolicy() {
			uni.navigateTo({
				url: './privacy-policy'
			})
		},
		
		openUserAgreement() {
			uni.navigateTo({
				url: './user-agreement'
			})
		},
		
		openOpenSource() {
			uni.navigateTo({
				url: './open-source'
			})
		},
		
		handleEasterEgg() {
			this.easterEggCount++
			
			if (this.easterEggCount === 1) {
				uni.showToast({
					title: '你发现了什么？',
					icon: 'none'
				})
			} else if (this.easterEggCount === 3) {
				uni.showToast({
					title: '继续点击试试...',
					icon: 'none'
				})
			} else if (this.easterEggCount === 7) {
				uni.showModal({
					title: '🎉 恭喜你！',
					content: '你发现了隐藏的彩蛋！感谢你对我们应用的关注和支持！',
					showCancel: false,
					success: () => {
						this.easterEggCount = 0
					}
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.about-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.app-info {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 40rpx;
	text-align: center;
	color: white;
	
	.app-logo {
		width: 120rpx;
		height: 120rpx;
		border-radius: 24rpx;
		margin-bottom: 30rpx;
	}
	
	.app-name {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}
	
	.app-version {
		display: block;
		font-size: 26rpx;
		opacity: 0.8;
		margin-bottom: 20rpx;
	}
	
	.app-slogan {
		font-size: 28rpx;
		opacity: 0.9;
	}
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin: 40rpx 30rpx 20rpx;
}

.app-description {
	margin: 20rpx;
	
	.description-content {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.description-text {
			display: block;
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
			margin-bottom: 20rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
}

.features {
	margin: 20rpx;
	
	.feature-list {
		background: white;
		border-radius: 15rpx;
		overflow: hidden;
		
		.feature-item {
			display: flex;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.feature-icon {
				font-size: 48rpx;
				margin-right: 30rpx;
			}
			
			.feature-info {
				flex: 1;
				
				.feature-name {
					display: block;
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;
				}
				
				.feature-desc {
					font-size: 26rpx;
					color: #666;
					line-height: 1.4;
				}
			}
		}
	}
}

.team-info {
	margin: 20rpx;
	
	.team-content {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.team-name {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 15rpx;
		}
		
		.team-desc {
			display: block;
			font-size: 26rpx;
			color: #666;
			margin-bottom: 30rpx;
		}
		
		.team-members {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 20rpx;
			
			.member-item {
				text-align: center;
				padding: 20rpx;
				background: #f8f8f8;
				border-radius: 10rpx;
				
				.member-name {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 8rpx;
				}
				
				.member-role {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
	}
}

.contact-info {
	margin: 20rpx;
	
	.contact-list {
		background: white;
		border-radius: 15rpx;
		overflow: hidden;
		
		.contact-item {
			display: flex;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.contact-icon {
				font-size: 36rpx;
				margin-right: 30rpx;
			}
			
			.contact-info {
				flex: 1;
				
				.contact-label {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 8rpx;
				}
				
				.contact-value {
					font-size: 26rpx;
					color: #666;
				}
			}
			
			.contact-action {
				font-size: 26rpx;
				color: #007aff;
			}
		}
	}
}

.legal-info {
	margin: 20rpx;
	
	.legal-list {
		background: white;
		border-radius: 15rpx;
		overflow: hidden;
		
		.legal-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.legal-text {
				font-size: 30rpx;
				color: #333;
			}
			
			.legal-arrow {
				font-size: 28rpx;
				color: #ccc;
			}
		}
	}
}

.copyright {
	text-align: center;
	margin: 40rpx 30rpx 20rpx;
	
	.copyright-text {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-bottom: 8rpx;
	}
}

.easter-egg {
	text-align: center;
	padding: 20rpx;
	
	.egg-text {
		font-size: 32rpx;
		opacity: 0.3;
	}
}
</style>