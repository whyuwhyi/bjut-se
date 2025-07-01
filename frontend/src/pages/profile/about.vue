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
					日新智链是专为北京工业大学师生设计的校园学习交流微信小程序，致力于打造"以学习者为中心"的智能化校园学习社区。
				</text>
				<text class="description-text">
					平台通过整合分散的校园信息资源，提供一站式的学习、交流、成长服务，促进知识共享和协作学习，让学习更简单，让知识更流动。
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
				<text class="team-name">SE2025-Team-03</text>
				<text class="team-desc">北京工业大学软件学院2025届学生团队</text>
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
				<view class="contact-item" @click="copyToClipboard('contact', 'support@bjut.edu.cn')">
					<text class="contact-icon">📧</text>
					<view class="contact-info">
						<text class="contact-label">技术支持</text>
						<text class="contact-value">support@bjut.edu.cn</text>
					</view>
					<text class="contact-action">复制</text>
				</view>
				
				<view class="contact-item" @click="openWebsite()">
					<text class="contact-icon">🌐</text>
					<view class="contact-info">
						<text class="contact-label">项目仓库</text>
						<text class="contact-value">github.com/SE2024-Team-01/wechat_software</text>
					</view>
					<text class="contact-action">访问</text>
				</view>
			</view>
		</view>

		<!-- 法律信息 -->
		<view class="legal-info">
			<text class="section-title">法律信息</text>
			<view class="legal-list">
				<view class="legal-item" @click="showPopup('privacy')">
					<text class="legal-text">隐私政策</text>
					<text class="legal-arrow">></text>
				</view>
				<view class="legal-item" @click="showPopup('user')">
					<text class="legal-text">用户协议</text>
					<text class="legal-arrow">></text>
				</view>
				<view class="legal-item" @click="showPopup('open')">
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

		<!-- 弹窗popup -->
		<view v-if="popupVisible" class="popup-mask" @click.self="closePopup">
			<view class="popup-window">
				<view class="popup-title">{{ popupTitle }}</view>
				<scroll-view scroll-y class="popup-content">
					<text>{{ popupContent }}</text>
				</scroll-view>
				<button class="popup-close" @click="closePopup">关闭</button>
			</view>
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
					description: '支持多种格式的学习资料分享，带审核流程保证质量'
				},
				{
					icon: '💬',
					name: '论坛交流',
					description: '多层级评论系统，师生互动讨论学习问题'
				},
				{
					icon: '📖',
					name: '学习管理',
					description: '制定学习计划、管理学习任务，跟踪学习进度'
				},
				{
					icon: '🔔',
					name: '通知系统',
					description: '及时接收系统通知和重要消息，不错过任何信息'
				},
				{
					icon: '👤',
					name: '个人中心',
					description: '管理个人资料、收藏内容、查看学习数据统计'
				},
				{
					icon: '🔍',
					name: '智能搜索',
					description: '强大的搜索功能，快速找到需要的学习资源'
				}
			],
			teamMembers: [
				{ name: '高家中', role: '项目负责人' },
				{ name: '李星原', role: '前端开发' },
				{ name: '余意', role: '后端开发' },
				{ name: '李桉弛', role: '系统架构' },
				{ name: '姚忠宝', role: '数据库设计' },
				{ name: '江依山', role: '测试工程师' }
			],
			popupVisible: false,
			popupTitle: '',
			popupContent: ''
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
		
		showPopup(type) {
			if (type === 'privacy') {
				this.popupTitle = '隐私政策';
				this.popupContent = '这里是隐私政策的示例内容。您的数据安全对我们至关重要，我们承诺不会泄露您的个人信息。';
			} else if (type === 'user') {
				this.popupTitle = '用户协议';
				this.popupContent = '这里是用户协议的示例内容。请您遵守平台规则，文明发言，尊重他人。';
			} else if (type === 'open') {
				this.popupTitle = '开源许可';
				this.popupContent = '这里是开源许可的示例内容。本项目部分代码基于MIT协议开源，欢迎学习和贡献。';
			}
			this.popupVisible = true;
		},
		
		closePopup() {
			this.popupVisible = false;
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

.popup-mask {
	position: fixed;
	left: 0; top: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.4);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}
.popup-window {
	background: #fff;
	border-radius: 20rpx;
	width: 80vw;
	max-width: 600rpx;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.18);
	padding: 40rpx 30rpx 30rpx 30rpx;
}
.popup-title {
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
	text-align: center;
}
.popup-content {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	line-height: 1.7;
	margin-bottom: 30rpx;
	overflow-y: auto;
	max-height: 40vh;
}
.popup-close {
	width: 100%;
	background: #667eea;
	color: #fff;
	border-radius: 12rpx;
	font-size: 30rpx;
	margin-top: 10rpx;
}
</style>