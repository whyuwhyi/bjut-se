<template>
	<view class="achievements-container">
		<!-- 成就统计 -->
		<view class="achievement-stats">
			<view class="stats-card">
				<text class="stats-number">{{ unlockedCount }}</text>
				<text class="stats-label">已解锁</text>
			</view>
			<view class="stats-divider"></view>
			<view class="stats-card">
				<text class="stats-number">{{ totalCount }}</text>
				<text class="stats-label">总成就</text>
			</view>
			<view class="stats-divider"></view>
			<view class="stats-card">
				<text class="stats-number">{{ completionRate }}%</text>
				<text class="stats-label">完成度</text>
			</view>
		</view>

		<!-- 成就分类 -->
		<view class="category-tabs">
			<scroll-view class="tabs-scroll" scroll-x="true">
				<view class="tab-list">
					<view class="tab-item" 
						v-for="(category, index) in categories" 
						:key="index"
						:class="{ 'active': currentCategory === category.key }"
						@click="switchCategory(category.key)">
						<text class="tab-text">{{ category.name }}</text>
						<view class="tab-badge" v-if="category.unlockedCount > 0">{{ category.unlockedCount }}</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 成就列表 -->
		<view class="achievement-list">
			<view class="achievement-item" 
				v-for="(achievement, index) in filteredAchievements" 
				:key="index"
				:class="{ 'unlocked': achievement.isUnlocked, 'hidden': achievement.isHidden }"
				@click="viewAchievementDetail(achievement)">
				
				<view class="achievement-icon">
					<text class="icon-emoji" v-if="achievement.isUnlocked || !achievement.isHidden">{{ achievement.icon }}</text>
					<text class="icon-placeholder" v-else>❓</text>
				</view>
				
				<view class="achievement-info">
					<text class="achievement-name" v-if="achievement.isUnlocked || !achievement.isHidden">{{ achievement.name }}</text>
					<text class="achievement-name hidden-name" v-else>神秘成就</text>
					
					<text class="achievement-desc" v-if="achievement.isUnlocked || !achievement.isHidden">{{ achievement.description }}</text>
					<text class="achievement-desc hidden-desc" v-else>完成特定条件后解锁</text>
					
					<!-- 进度条 -->
					<view class="progress-bar" v-if="achievement.progress !== undefined">
						<view class="progress-bg">
							<view class="progress-fill" :style="{ width: getProgressWidth(achievement) }"></view>
						</view>
						<text class="progress-text">{{ achievement.currentValue || 0 }}/{{ achievement.targetValue }}</text>
					</view>
					
					<!-- 解锁时间 -->
					<text class="unlock-time" v-if="achievement.isUnlocked && achievement.unlockTime">
						{{ formatTime(achievement.unlockTime) }}解锁
					</text>
				</view>
				
				<!-- 成就等级 -->
				<view class="achievement-level" v-if="achievement.level">
					<text class="level-text">{{ getLevelText(achievement.level) }}</text>
				</view>
				
				<!-- 奖励信息 -->
				<view class="achievement-reward" v-if="achievement.reward && achievement.isUnlocked">
					<text class="reward-text">+{{ achievement.reward }}积分</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="filteredAchievements.length === 0">
			<text class="empty-icon">🏆</text>
			<text class="empty-text">该分类下暂无成就</text>
			<text class="empty-desc">去完成更多任务解锁成就吧</text>
		</view>

		<!-- 成就分享 -->
		<view class="share-section" v-if="hasUnlockedAchievements">
			<view class="share-btn" @click="shareAchievements">
				<text class="share-text">分享我的成就</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentCategory: 'all',
			categories: [
				{ key: 'all', name: '全部', unlockedCount: 0 },
				{ key: 'learning', name: '学习成就', unlockedCount: 0 },
				{ key: 'social', name: '社交成就', unlockedCount: 0 },
				{ key: 'activity', name: '活动成就', unlockedCount: 0 },
				{ key: 'special', name: '特殊成就', unlockedCount: 0 }
			],
			achievements: []
		}
	},
	
	computed: {
		filteredAchievements() {
			if (this.currentCategory === 'all') {
				return this.achievements
			}
			return this.achievements.filter(item => item.category === this.currentCategory)
		},
		
		unlockedCount() {
			return this.achievements.filter(item => item.isUnlocked).length
		},
		
		totalCount() {
			return this.achievements.length
		},
		
		completionRate() {
			if (this.totalCount === 0) return 0
			return Math.round((this.unlockedCount / this.totalCount) * 100)
		},
		
		hasUnlockedAchievements() {
			return this.unlockedCount > 0
		}
	},
	
	onLoad() {
		this.loadAchievements()
	},
	
	methods: {
		async loadAchievements() {
			try {
				// 模拟加载成就数据
				this.achievements = [
					{
						id: 1,
						name: '初来乍到',
						description: '完成用户注册',
						icon: '🌟',
						category: 'learning',
						level: 'bronze',
						isUnlocked: true,
						unlockTime: new Date('2025-06-01'),
						reward: 10,
						isHidden: false
					},
					{
						id: 2,
						name: '学者',
						description: '上传10个学习资源',
						icon: '📚',
						category: 'learning',
						level: 'silver',
						isUnlocked: true,
						unlockTime: new Date('2025-06-10'),
						reward: 50,
						currentValue: 10,
						targetValue: 10,
						isHidden: false
					},
					{
						id: 3,
						name: '知识分享者',
						description: '上传50个学习资源',
						icon: '🎓',
						category: 'learning',
						level: 'gold',
						isUnlocked: false,
						currentValue: 24,
						targetValue: 50,
						reward: 200,
						isHidden: false
					},
					{
						id: 4,
						name: '话痨',
						description: '发布50个讨论',
						icon: '💬',
						category: 'social',
						level: 'silver',
						isUnlocked: true,
						unlockTime: new Date('2025-06-15'),
						reward: 30,
						isHidden: false
					},
					{
						id: 5,
						name: '人气王',
						description: '获得100个赞',
						icon: '❤️',
						category: 'social',
						level: 'gold',
						isUnlocked: false,
						currentValue: 67,
						targetValue: 100,
						reward: 100,
						isHidden: false
					},
					{
						id: 6,
						name: '活动达人',
						description: '参与10次社团活动',
						icon: '🎯',
						category: 'activity',
						level: 'silver',
						isUnlocked: false,
						currentValue: 3,
						targetValue: 10,
						reward: 80,
						isHidden: false
					},
					{
						id: 7,
						name: '神秘探索者',
						description: '发现隐藏功能',
						icon: '🔍',
						category: 'special',
						level: 'legendary',
						isUnlocked: false,
						reward: 500,
						isHidden: true
					}
				]
				
				this.calculateCategoryStats()
			} catch (error) {
				console.error('加载成就失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		calculateCategoryStats() {
			this.categories.forEach(category => {
				if (category.key === 'all') {
					category.unlockedCount = this.unlockedCount
				} else {
					const categoryAchievements = this.achievements.filter(item => item.category === category.key)
					category.unlockedCount = categoryAchievements.filter(item => item.isUnlocked).length
				}
			})
		},
		
		switchCategory(categoryKey) {
			this.currentCategory = categoryKey
		},
		
		viewAchievementDetail(achievement) {
			if (achievement.isHidden && !achievement.isUnlocked) {
				uni.showToast({
					title: '神秘成就暂未解锁',
					icon: 'none'
				})
				return
			}
			
			const statusText = achievement.isUnlocked ? '已解锁' : '未解锁'
			let content = `${achievement.description}\n\n等级：${this.getLevelText(achievement.level)}\n状态：${statusText}`
			
			if (achievement.reward) {
				content += `\n奖励：${achievement.reward}积分`
			}
			
			if (achievement.progress !== undefined && !achievement.isUnlocked) {
				content += `\n进度：${achievement.currentValue || 0}/${achievement.targetValue}`
			}
			
			uni.showModal({
				title: achievement.name,
				content: content,
				showCancel: false
			})
		},
		
		getProgressWidth(achievement) {
			if (!achievement.targetValue) return '0%'
			const progress = Math.min((achievement.currentValue || 0) / achievement.targetValue * 100, 100)
			return progress + '%'
		},
		
		getLevelText(level) {
			const levelMap = {
				'bronze': '青铜',
				'silver': '白银',
				'gold': '黄金',
				'diamond': '钻石',
				'legendary': '传说'
			}
			return levelMap[level] || '普通'
		},
		
		formatTime(time) {
			return time.toLocaleDateString()
		},
		
		shareAchievements() {
			const shareText = `我在日新智链已经解锁了${this.unlockedCount}个成就，完成度${this.completionRate}%！`
			
			uni.showActionSheet({
				itemList: ['分享到微信', '分享到QQ', '复制链接'],
				success: (res) => {
					if (res.tapIndex === 0) {
						// 分享到微信
						uni.showToast({
							title: '分享到微信',
							icon: 'success'
						})
					} else if (res.tapIndex === 1) {
						// 分享到QQ
						uni.showToast({
							title: '分享到QQ',
							icon: 'success'
						})
					} else if (res.tapIndex === 2) {
						// 复制链接
						uni.setClipboardData({
							data: shareText,
							success: () => {
								uni.showToast({
									title: '已复制到剪贴板',
									icon: 'success'
								})
							}
						})
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.achievements-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.achievement-stats {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx;
	display: flex;
	align-items: center;
	justify-content: space-around;
	color: white;
	
	.stats-card {
		text-align: center;
		
		.stats-number {
			display: block;
			font-size: 48rpx;
			font-weight: bold;
			margin-bottom: 8rpx;
		}
		
		.stats-label {
			font-size: 24rpx;
			opacity: 0.8;
		}
	}
	
	.stats-divider {
		width: 2rpx;
		height: 60rpx;
		background: rgba(255, 255, 255, 0.3);
	}
}

.category-tabs {
	background: white;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	.tabs-scroll {
		white-space: nowrap;
		
		.tab-list {
			display: flex;
			padding: 0 30rpx;
			
			.tab-item {
				position: relative;
				padding: 15rpx 30rpx;
				margin-right: 20rpx;
				border-radius: 30rpx;
				background: #f8f8f8;
				white-space: nowrap;
				
				&.active {
					background: #007aff;
					
					.tab-text {
						color: white;
					}
				}
				
				.tab-text {
					font-size: 26rpx;
					color: #666;
				}
				
				.tab-badge {
					position: absolute;
					top: -8rpx;
					right: -8rpx;
					background: #ff3b30;
					color: white;
					font-size: 20rpx;
					padding: 4rpx 8rpx;
					border-radius: 12rpx;
					min-width: 20rpx;
					text-align: center;
				}
			}
		}
	}
}

.achievement-list {
	margin: 20rpx;
	
	.achievement-item {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		margin-bottom: 15rpx;
		display: flex;
		align-items: flex-start;
		position: relative;
		
		&.unlocked {
			border-left: 6rpx solid #5ac725;
		}
		
		&.hidden:not(.unlocked) {
			opacity: 0.6;
		}
		
		.achievement-icon {
			margin-right: 30rpx;
			
			.icon-emoji {
				font-size: 60rpx;
				line-height: 1;
			}
			
			.icon-placeholder {
				font-size: 60rpx;
				opacity: 0.5;
			}
		}
		
		.achievement-info {
			flex: 1;
			
			.achievement-name {
				display: block;
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 10rpx;
				
				&.hidden-name {
					color: #999;
				}
			}
			
			.achievement-desc {
				display: block;
				font-size: 26rpx;
				color: #666;
				margin-bottom: 15rpx;
				line-height: 1.4;
				
				&.hidden-desc {
					font-style: italic;
				}
			}
			
			.progress-bar {
				display: flex;
				align-items: center;
				margin-bottom: 10rpx;
				
				.progress-bg {
					flex: 1;
					height: 8rpx;
					background: #f0f0f0;
					border-radius: 4rpx;
					margin-right: 20rpx;
					overflow: hidden;
					
					.progress-fill {
						height: 100%;
						background: #007aff;
						border-radius: 4rpx;
						transition: width 0.3s ease;
					}
				}
				
				.progress-text {
					font-size: 22rpx;
					color: #666;
				}
			}
			
			.unlock-time {
				font-size: 22rpx;
				color: #5ac725;
			}
		}
		
		.achievement-level {
			position: absolute;
			top: 20rpx;
			right: 20rpx;
			
			.level-text {
				font-size: 20rpx;
				color: #ff9500;
				background: #fff3cd;
				padding: 4rpx 12rpx;
				border-radius: 12rpx;
			}
		}
		
		.achievement-reward {
			position: absolute;
			bottom: 20rpx;
			right: 20rpx;
			
			.reward-text {
				font-size: 22rpx;
				color: #007aff;
				background: #f0f8ff;
				padding: 4rpx 12rpx;
				border-radius: 12rpx;
			}
		}
	}
}

.empty-state {
	text-align: center;
	padding: 120rpx 60rpx;
	
	.empty-icon {
		display: block;
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}
	
	.empty-text {
		display: block;
		font-size: 32rpx;
		color: #666;
		margin-bottom: 15rpx;
	}
	
	.empty-desc {
		font-size: 26rpx;
		color: #999;
	}
}

.share-section {
	margin: 40rpx 20rpx 20rpx;
	
	.share-btn {
		background: #007aff;
		border-radius: 30rpx;
		padding: 30rpx;
		text-align: center;
		
		.share-text {
			font-size: 32rpx;
			color: white;
			font-weight: bold;
		}
	}
}
</style>