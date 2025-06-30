<template>
	<view class="followers-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<text class="stats-text">共有 {{ totalCount }} 位粉丝</text>
		</view>

		<!-- 粉丝列表 -->
		<view class="followers-list" v-if="followersList.length > 0">
			<view 
				class="follower-item" 
				v-for="(item, index) in followersList" 
				:key="item.follow_id"
				@click="viewProfile(item.follower)"
			>
				<view class="user-info">
					<image 
						class="user-avatar" 
						:src="item.follower.avatar_url || '/static/default-avatar.png'"
						mode="aspectFill"
					></image>
					<view class="user-details">
						<text class="user-name">{{ item.follower.nickname || item.follower.name }}</text>
						<text class="user-bio" v-if="item.follower.bio">{{ item.follower.bio }}</text>
						<text class="follow-time">{{ formatFollowTime(item.created_at) }}关注了你</text>
					</view>
				</view>
				
				<view class="action-buttons">
					<button 
						class="follow-btn"
						:class="{ 'is-following': item.isFollowingBack }"
						@click.stop="toggleFollowBack(item)"
					>
						{{ item.isFollowingBack ? '已关注' : '回关' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else-if="!loading">
			<text class="empty-icon">👥</text>
			<text class="empty-title">还没有粉丝</text>
			<text class="empty-desc">分享更多优质内容吸引粉丝吧</text>
			<button class="share-btn" @click="goToShare">分享内容</button>
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
			followersList: [],
			totalCount: 0,
			loading: false,
			page: 1,
			hasMore: true
		}
	},
	
	onLoad() {
		this.loadFollowers()
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.hasMore = true
		this.loadFollowers(true)
	},
	
	methods: {
		async loadFollowers(refresh = false) {
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
					url: `${this.$config.apiBaseUrl}/users/followers`,
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
					const { followers, total, page, limit } = response.data.data
					
					// 为每个粉丝检查是否已经回关
					const followersWithStatus = await this.checkFollowBackStatus(followers)
					
					if (refresh) {
						this.followersList = followersWithStatus
						this.page = 1
						uni.stopPullDownRefresh()
					} else {
						this.followersList = [...this.followersList, ...followersWithStatus]
					}
					
					this.totalCount = total
					this.hasMore = followers.length === limit
					this.page = page + 1
				} else {
					uni.showToast({
						title: response.data.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载粉丝列表失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		async checkFollowBackStatus(followers) {
			try {
				const token = uni.getStorageSync('token')
				
				// 获取当前用户的关注列表
				const followingResponse = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/following`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					},
					data: {
						page: 1,
						limit: 1000 // 获取所有关注
					}
				})
				
				const followingPhones = new Set()
				if (followingResponse.data.success) {
					followingResponse.data.data.following.forEach(follow => {
						if (follow.status === 'active') {
							followingPhones.add(follow.followingUser.phone_number)
						}
					})
				}
				
				// 为粉丝添加回关状态
				return followers.map(follower => ({
					...follower,
					isFollowingBack: followingPhones.has(follower.follower.phone_number)
				}))
			} catch (error) {
				console.error('检查回关状态失败:', error)
				return followers.map(follower => ({
					...follower,
					isFollowingBack: false
				}))
			}
		},
		
		async loadMore() {
			if (this.hasMore && !this.loading) {
				await this.loadFollowers()
			}
		},
		
		async toggleFollowBack(item) {
			try {
				const token = uni.getStorageSync('token')
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/follow/${item.follower.phone_number}`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					// 更新回关状态
					item.isFollowingBack = response.data.data.isFollowing
					
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
		
		goToShare() {
			// 跳转到分享内容页面
			uni.switchTab({
				url: '/pages/resources/resources'
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
.followers-container {
	background: #f5f5f5;
	min-height: 100vh;
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

.followers-list {
	padding: 20rpx;
}

.follower-item {
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
		
		.follow-btn {
			padding: 12rpx 24rpx;
			background: #007aff;
			color: white;
			border: none;
			border-radius: 20rpx;
			font-size: 24rpx;
			
			&.is-following {
				background: #f0f0f0;
				color: #666;
			}
			
			&:active {
				opacity: 0.8;
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
	
	.share-btn {
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