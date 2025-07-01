<template>
	<view class="following-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<text class="stats-text">共关注 {{ totalCount }} 人</text>
		</view>

		<!-- 关注列表 -->
		<view class="following-list" v-if="followingList.length > 0">
			<view 
				class="following-item" 
				v-for="(item, index) in followingList" 
				:key="item.follow_id"
				@click="viewProfile(item.followingUser)"
			>
				<view class="user-info">
					<image 
						class="user-avatar" 
						:src="item.followingUser.avatar_url || '/static/default-avatar.png'"
						mode="aspectFill"
					></image>
					<view class="user-details">
						<text class="user-name">{{ item.followingUser.nickname || item.followingUser.name }}</text>
						<text class="user-bio" v-if="item.followingUser.bio">{{ item.followingUser.bio }}</text>
						<text class="follow-time">{{ formatFollowTime(item.created_at) }}关注</text>
					</view>
				</view>
				
				<view class="action-buttons">
					<button 
						class="unfollow-btn"
						@click.stop="toggleFollow(item)"
					>
						{{ item.status === 'active' ? '取消关注' : '重新关注' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else-if="!loading">
			<text class="empty-icon">👥</text>
			<text class="empty-title">还没有关注任何人</text>
			<text class="empty-desc">关注其他用户，获取他们的最新动态</text>
			<button class="discover-btn" @click="goToDiscover">发现用户</button>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && !loading">
			<button class="load-more-btn" @click="loadMore">加载更多</button>
		</view>

		<!-- 加载中 -->
		<view class="loading" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			followingList: [],
			totalCount: 0,
			loading: false,
			page: 1,
			hasMore: true
		}
	},
	
	onLoad() {
		this.loadFollowing()
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.hasMore = true
		this.loadFollowing(true)
	},
	
	methods: {
		async loadFollowing(refresh = false) {
			if (this.loading) return
			
			try {
				this.loading = true
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.redirectTo({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/following`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					},
					data: {
						page: refresh ? 1 : this.page,
						limit: 20
					}
				})
				
				if (response.data.success) {
					const { following, total, page, limit } = response.data.data
					
					if (refresh) {
						this.followingList = following
						this.page = 1
						uni.stopPullDownRefresh()
					} else {
						this.followingList = [...this.followingList, ...following]
					}
					
					this.totalCount = total
					this.hasMore = following.length === limit
					this.page = page + 1
				} else {
					uni.showToast({
						title: response.data.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载关注列表失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		async loadMore() {
			if (this.hasMore && !this.loading) {
				await this.loadFollowing()
			}
		},
		
		async toggleFollow(item) {
			try {
				const token = uni.getStorageSync('token')
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/follow/${item.followingUser.phone_number}`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					// 更新关注状态
					item.status = response.data.data.isFollowing ? 'active' : 'cancelled'
					
					// 更新总数
					if (response.data.data.isFollowing) {
						this.totalCount++
					} else {
						this.totalCount--
					}
					
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: response.data.message || '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('关注操作失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			}
		},
		
		viewProfile(user) {
			// 跳转到用户详情页面（如果有的话）
			uni.showToast({
				title: `查看 ${user.nickname || user.name} 的资料`,
				icon: 'none'
			})
		},
		
		goToDiscover() {
			// 跳转到发现页面或论坛页面
			uni.switchTab({
				url: '/pages/forum/forum'
			})
		},
		
		formatFollowTime(time) {
			if (!time) return ''
			
			const date = new Date(time)
			const now = new Date()
			const diff = now - date
			const days = Math.floor(diff / (24 * 60 * 60 * 1000))
			
			if (days === 0) {
				return '今天'
			} else if (days < 30) {
				return `${days}天前`
			} else if (days < 365) {
				return `${Math.floor(days / 30)}个月前`
			} else {
				return `${Math.floor(days / 365)}年前`
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.following-container {
	min-height: 100vh;
	padding: 30rpx;
	padding-bottom: 160rpx;
}

.stats-header {
	background: white;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.stats-text {
		font-size: 28rpx;
		color: #666;
	}
}

.following-list {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.following-item {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	
	.user-info {
		display: flex;
		align-items: center;
		flex: 1;
		
		.user-avatar {
			width: 100rpx;
			height: 100rpx;
			border-radius: 50%;
			margin-right: 24rpx;
			background: #f0f0f0;
		}
		
		.user-details {
			flex: 1;
			
			.user-name {
				display: block;
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
				margin-bottom: 8rpx;
			}
			
			.user-bio {
				display: block;
				font-size: 24rpx;
				color: #666;
				margin-bottom: 8rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.follow-time {
				font-size: 22rpx;
				color: #999;
			}
		}
	}
	
	.action-buttons {
		margin-left: 20rpx;
		
		.unfollow-btn {
			padding: 12rpx 24rpx;
			background: #f0f0f0;
			color: #666;
			border: none;
			border-radius: 20rpx;
			font-size: 24rpx;
			
			&:active {
				background: #e0e0e0;
			}
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 60rpx;
	text-align: center;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
		opacity: 0.6;
	}
	
	.empty-title {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 48rpx;
	}
	
	.discover-btn {
		padding: 20rpx 40rpx;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 24rpx;
		font-size: 28rpx;
	}
}

.load-more {
	padding: 20rpx;
	text-align: center;
	
	.load-more-btn {
		background: #f8f8f8;
		color: #666;
		border: none;
		border-radius: 50rpx;
		padding: 20rpx 40rpx;
		font-size: 26rpx;
	}
}

.loading {
	padding: 40rpx;
	text-align: center;
	
	.loading-text {
		font-size: 26rpx;
		color: #999;
	}
}
</style>