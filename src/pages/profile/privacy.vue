<template>
	<view class="privacy-container">
		<!-- 隐私控制 -->
		<view class="settings-group">
			<text class="group-title">隐私控制</text>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">资料可见性</text>
					<text class="setting-desc">设置谁可以查看你的个人资料</text>
				</view>
				<picker class="setting-picker" :value="profileVisibilityIndex" :range="profileVisibilityOptions" @change="onProfileVisibilityChange">
					<view class="picker-content">
						<text class="picker-text">{{ profileVisibilityOptions[profileVisibilityIndex] }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">关注列表可见</text>
					<text class="setting-desc">允许他人查看你的关注和粉丝列表</text>
				</view>
				<switch class="setting-switch" :checked="settings.followListVisible" @change="onFollowListVisibleChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">学习进度可见</text>
					<text class="setting-desc">允许他人查看你的学习数据和成就</text>
				</view>
				<switch class="setting-switch" :checked="settings.learningProgressVisible" @change="onLearningProgressVisibleChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">在线状态显示</text>
					<text class="setting-desc">显示你的在线状态给其他用户</text>
				</view>
				<switch class="setting-switch" :checked="settings.onlineStatusVisible" @change="onOnlineStatusVisibleChange" />
			</view>
		</view>

		<!-- 消息设置 -->
		<view class="settings-group">
			<text class="group-title">消息设置</text>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">允许陌生人私信</text>
					<text class="setting-desc">非关注用户也可以给你发送私信</text>
				</view>
				<switch class="setting-switch" :checked="settings.allowStrangerMessage" @change="onAllowStrangerMessageChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">消息已读回执</text>
					<text class="setting-desc">对方可以看到你是否已读消息</text>
				</view>
				<switch class="setting-switch" :checked="settings.messageReadReceipt" @change="onMessageReadReceiptChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">群聊邀请确认</text>
					<text class="setting-desc">被邀请加入群聊时需要你的确认</text>
				</view>
				<switch class="setting-switch" :checked="settings.groupInviteConfirm" @change="onGroupInviteConfirmChange" />
			</view>
		</view>

		<!-- 数据控制 -->
		<view class="settings-group">
			<text class="group-title">数据控制</text>
			
			<view class="setting-item" @click="showDataUsage">
				<view class="setting-info">
					<text class="setting-name">数据使用情况</text>
					<text class="setting-desc">查看你的数据使用统计</text>
				</view>
				<text class="setting-arrow">></text>
			</view>
			
			<view class="setting-item" @click="exportData">
				<view class="setting-info">
					<text class="setting-name">导出我的数据</text>
					<text class="setting-desc">下载你在平台上的所有数据</text>
				</view>
				<text class="setting-arrow">></text>
			</view>
			
			<view class="setting-item" @click="deleteAccount">
				<view class="setting-info">
					<text class="setting-name danger">删除账号</text>
					<text class="setting-desc danger">永久删除你的账号和所有数据</text>
				</view>
				<text class="setting-arrow">></text>
			</view>
		</view>

		<!-- 黑名单管理 -->
		<view class="settings-group">
			<text class="group-title">黑名单管理</text>
			
			<view class="setting-item" @click="manageBlockList">
				<view class="setting-info">
					<text class="setting-name">屏蔽用户管理</text>
					<text class="setting-desc">管理你屏蔽的用户列表</text>
				</view>
				<view class="setting-badge" v-if="blockedUsersCount > 0">{{ blockedUsersCount }}</view>
				<text class="setting-arrow">></text>
			</view>
			
			<view class="setting-item" @click="manageKeywordFilter">
				<view class="setting-info">
					<text class="setting-name">关键词过滤</text>
					<text class="setting-desc">设置要过滤的敏感词汇</text>
				</view>
				<text class="setting-arrow">></text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			profileVisibilityIndex: 0,
			profileVisibilityOptions: ['所有人', '仅关注的人', '仅自己'],
			blockedUsersCount: 0,
			settings: {
				followListVisible: true,
				learningProgressVisible: true,
				onlineStatusVisible: true,
				allowStrangerMessage: true,
				messageReadReceipt: true,
				groupInviteConfirm: true
			}
		}
	},
	
	onLoad() {
		this.loadPrivacySettings()
	},
	
	methods: {
		async loadPrivacySettings() {
			try {
				// 模拟加载用户隐私设置
				this.blockedUsersCount = 2
			} catch (error) {
				console.error('加载隐私设置失败:', error)
			}
		},
		
		onProfileVisibilityChange(e) {
			this.profileVisibilityIndex = e.detail.value
			this.saveSettings()
		},
		
		onFollowListVisibleChange(e) {
			this.settings.followListVisible = e.detail.value
			this.saveSettings()
		},
		
		onLearningProgressVisibleChange(e) {
			this.settings.learningProgressVisible = e.detail.value
			this.saveSettings()
		},
		
		onOnlineStatusVisibleChange(e) {
			this.settings.onlineStatusVisible = e.detail.value
			this.saveSettings()
		},
		
		onAllowStrangerMessageChange(e) {
			this.settings.allowStrangerMessage = e.detail.value
			this.saveSettings()
		},
		
		onMessageReadReceiptChange(e) {
			this.settings.messageReadReceipt = e.detail.value
			this.saveSettings()
		},
		
		onGroupInviteConfirmChange(e) {
			this.settings.groupInviteConfirm = e.detail.value
			this.saveSettings()
		},
		
		async saveSettings() {
			try {
				// 实际应调用云函数保存设置
				console.log('保存隐私设置:', this.settings)
				uni.showToast({
					title: '设置已保存',
					icon: 'success'
				})
			} catch (error) {
				console.error('保存设置失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		},
		
		showDataUsage() {
			uni.navigateTo({
				url: './data-usage'
			})
		},
		
		exportData() {
			uni.showModal({
				title: '导出数据',
				content: '我们将准备你的数据并通过邮件发送给你，这可能需要几分钟时间',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({
							title: '准备数据中...'
						})
						
						setTimeout(() => {
							uni.hideLoading()
							uni.showToast({
								title: '导出请求已提交',
								icon: 'success'
							})
						}, 2000)
					}
				}
			})
		},
		
		deleteAccount() {
			uni.showModal({
				title: '危险操作',
				content: '删除账号将永久清除你的所有数据，此操作不可恢复。确定要继续吗？',
				confirmColor: '#ff3b30',
				success: (res) => {
					if (res.confirm) {
						uni.showModal({
							title: '最后确认',
							content: '请再次确认你要删除账号。删除后将无法恢复任何数据。',
							confirmColor: '#ff3b30',
							success: (res2) => {
								if (res2.confirm) {
									this.performDeleteAccount()
								}
							}
						})
					}
				}
			})
		},
		
		performDeleteAccount() {
			uni.showLoading({
				title: '处理中...'
			})
			
			setTimeout(() => {
				uni.hideLoading()
				uni.showModal({
					title: '删除完成',
					content: '你的账号已成功删除。感谢你使用我们的服务。',
					showCancel: false,
					success: () => {
						uni.reLaunch({
							url: '../login/login'
						})
					}
				})
			}, 3000)
		},
		
		manageBlockList() {
			uni.navigateTo({
				url: './block-list'
			})
		},
		
		manageKeywordFilter() {
			uni.navigateTo({
				url: './keyword-filter'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.privacy-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.settings-group {
	margin: 20rpx;
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
	
	.group-title {
		display: block;
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		padding: 30rpx 30rpx 20rpx;
		background: #fafafa;
	}
	
	.setting-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.setting-info {
			flex: 1;
			
			.setting-name {
				display: block;
				font-size: 30rpx;
				color: #333;
				margin-bottom: 8rpx;
				
				&.danger {
					color: #ff3b30;
				}
			}
			
			.setting-desc {
				font-size: 24rpx;
				color: #666;
				
				&.danger {
					color: #ff9999;
				}
			}
		}
		
		.setting-switch {
			transform: scale(0.8);
		}
		
		.setting-picker {
			.picker-content {
				display: flex;
				align-items: center;
				
				.picker-text {
					font-size: 28rpx;
					color: #007aff;
					margin-right: 10rpx;
				}
				
				.picker-arrow {
					font-size: 24rpx;
					color: #ccc;
				}
			}
		}
		
		.setting-badge {
			background: #ff3b30;
			color: white;
			font-size: 20rpx;
			padding: 4rpx 12rpx;
			border-radius: 15rpx;
			margin-right: 15rpx;
		}
		
		.setting-arrow {
			font-size: 28rpx;
			color: #ccc;
		}
	}
}
</style>