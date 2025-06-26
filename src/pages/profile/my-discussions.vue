<template>
	<view class="my-posts-container">
		<!-- 顶部统计 -->
		<view class="stats-section">
			<view class="stat-item">
				<text class="stat-number">{{ totalPosts }}</text>
				<text class="stat-label">总帖子</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ totalComments }}</text>
				<text class="stat-label">获得评论</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ totalLikes }}</text>
				<text class="stat-label">获得点赞</text>
			</view>
		</view>
		
		<!-- 筛选标签 -->
		<view class="filter-section">
			<view 
				class="filter-tab" 
				:class="{ active: currentTab === 'all' }"
				@click="switchTab('all')"
			>
				<text class="tab-text">全部</text>
			</view>
			<view 
				class="filter-tab" 
				:class="{ active: currentTab === 'active' }"
				@click="switchTab('active')"
			>
				<text class="tab-text">已发布</text>
			</view>
			<view 
				class="filter-tab" 
				:class="{ active: currentTab === 'hidden' }"
				@click="switchTab('hidden')"
			>
				<text class="tab-text">已隐藏</text>
			</view>
		</view>
		
		<!-- 帖子列表 -->
		<view class="posts-list">
			<view 
				class="post-item" 
				v-for="(post, index) in posts" 
				:key="post.post_id"
				@click="viewPost(post)"
			>
				<view class="post-header">
					<view class="post-meta">
						<text class="post-status">{{ getStatusLabel(post.status) }}</text>
						<view class="post-tags" v-if="post.tags && post.tags.length > 0">
							<text 
								class="post-tag" 
								v-for="tag in post.tags.slice(0, 2)" 
								:key="tag.tag_id"
								:style="{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }"
							>
								{{ tag.tag_name }}
							</text>
						</view>
					</view>
					<text class="post-time">{{ formatTime(post.created_at) }}</text>
				</view>
				
				<view class="post-content">
					<text class="post-title">{{ post.title }}</text>
					<text class="post-excerpt">{{ getExcerpt(post.content) }}</text>
				</view>
				
				<view class="post-stats">
					<text class="stat-item">👁️ {{ post.view_count }}</text>
					<text class="stat-item">💬 {{ post.comment_count }}</text>
					<text class="stat-item">❤️ {{ post.like_count }}</text>
				</view>
				
				<view class="post-actions">
					<view class="action-btn" @click.stop="editPost(post)">
						<text class="action-text">编辑</text>
					</view>
					<view class="action-btn danger" @click.stop="deletePost(post)">
						<text class="action-text">删除</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-if="posts.length === 0 && !loading">
			<text class="empty-icon">💭</text>
			<text class="empty-text">{{ getEmptyText() }}</text>
			<button class="empty-action" @click="goToCreate">发布帖子</button>
		</view>
		
		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && !loading">
			<button class="load-more-btn" @click="loadMore">加载更多</button>
		</view>
		
		<!-- 加载中提示 -->
		<view class="loading" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTab: 'all',
			posts: [],
			totalPosts: 0,
			totalComments: 0,
			totalLikes: 0,
			loading: false,
			page: 1,
			hasMore: true
		}
	},
	
	onLoad() {
		this.loadPosts()
		this.loadStats()
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.hasMore = true
		this.loadPosts(true)
	},
	
	methods: {
		async loadPosts(refresh = false) {
			if (this.loading) return
			
			try {
				this.loading = true
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				const params = {
					page: refresh ? 1 : this.page,
					limit: 10,
					status: this.currentTab === 'all' ? '' : this.currentTab,
					author: 'me'
				}
				
				const response = await uni.request({
					url: 'http://localhost:3000/api/v1/posts',
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					},
					data: params
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const { posts, pagination } = response.data.data
					
					if (refresh) {
						this.posts = posts
						this.page = 1
						uni.stopPullDownRefresh()
					} else {
						this.posts = [...this.posts, ...posts]
					}
					
					this.hasMore = pagination.currentPage < pagination.totalPages
					this.page = pagination.currentPage + 1
				}
			} catch (error) {
				console.error('加载帖子列表失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		async loadStats() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				// 这里需要后端提供统计接口
				// 暂时使用模拟数据
				this.totalPosts = this.posts.length
				this.totalComments = this.posts.reduce((sum, post) => sum + post.comment_count, 0)
				this.totalLikes = this.posts.reduce((sum, post) => sum + post.like_count, 0)
			} catch (error) {
				console.error('加载统计数据失败:', error)
			}
		},
		
		async loadMore() {
			if (this.hasMore && !this.loading) {
				await this.loadPosts()
			}
		},
		
		switchTab(tab) {
			this.currentTab = tab
			this.page = 1
			this.hasMore = true
			this.loadPosts(true)
		},
		
		viewPost(post) {
			uni.navigateTo({
				url: `../forum/detail?id=${post.post_id}`
			})
		},
		
		editPost(post) {
			uni.navigateTo({
				url: `../forum/create?id=${post.post_id}&mode=edit`
			})
		},
		
		async deletePost(post) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个帖子吗？删除后无法恢复。',
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token')
							const response = await uni.request({
								url: `http://localhost:3000/api/v1/posts/${post.post_id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							})
							
							if (response.statusCode === 200 && response.data.success) {
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								
								// 从列表中移除
								this.posts = this.posts.filter(p => p.post_id !== post.post_id)
								this.totalPosts--
							} else {
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								})
							}
						} catch (error) {
							console.error('删除帖子失败:', error)
							uni.showToast({
								title: '网络错误',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		goToCreate() {
			uni.navigateTo({
				url: '../forum/create'
			})
		},
		
		getStatusLabel(status) {
			const statusMap = {
				'active': '已发布',
				'hidden': '已隐藏',
				'deleted': '已删除'
			}
			return statusMap[status] || '未知'
		},
		
		getEmptyText() {
			switch (this.currentTab) {
				case 'hidden':
					return '没有隐藏的帖子'
				case 'active':
					return '没有已发布的帖子'
				default:
					return '还没有发布过帖子'
			}
		},
		
		getExcerpt(content) {
			if (!content) return ''
			// 移除markdown标记，获取纯文本摘要
			const plainText = content.replace(/[#*`>-]/g, '').replace(/\n/g, ' ')
			return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
		},
		
		formatTime(time) {
			if (!time) return '未知时间'
			
			const date = new Date(time)
			if (isNaN(date.getTime())) {
				return '时间格式错误'
			}
			
			const now = new Date()
			const diff = now - date
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return date.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.my-posts-container {
	background: #f5f5f5;
	min-height: 100vh;
}

.stats-section {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 20rpx;
	display: flex;
	justify-content: space-around;
	
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.stat-number {
			font-size: 48rpx;
			font-weight: bold;
			color: white;
			margin-bottom: 10rpx;
		}
		
		.stat-label {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.8);
		}
	}
}

.filter-section {
	background: white;
	display: flex;
	padding: 0 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.filter-tab {
		flex: 1;
		padding: 30rpx 0;
		text-align: center;
		position: relative;
		
		&.active {
			.tab-text {
				color: #007aff;
				font-weight: bold;
			}
			
			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 60rpx;
				height: 4rpx;
				background: #007aff;
				border-radius: 2rpx;
			}
		}
		
		.tab-text {
			font-size: 28rpx;
			color: #666;
		}
	}
}

.posts-list {
	padding: 20rpx;
	
	.post-item {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.post-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			.post-meta {
				display: flex;
				flex-direction: column;
				gap: 10rpx;
				
				.post-status {
					font-size: 22rpx;
					color: #666;
					background: #f0f0f0;
					padding: 6rpx 12rpx;
					border-radius: 12rpx;
					align-self: flex-start;
				}
				
				.post-tags {
					display: flex;
					gap: 8rpx;
					
					.post-tag {
						font-size: 20rpx;
						padding: 4rpx 8rpx;
						border-radius: 10rpx;
					}
				}
			}
			
			.post-time {
				font-size: 22rpx;
				color: #999;
			}
		}
		
		.post-content {
			margin-bottom: 20rpx;
			
			.post-title {
				display: block;
				font-size: 30rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 15rpx;
				line-height: 1.4;
			}
			
			.post-excerpt {
				display: block;
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
			}
		}
		
		.post-stats {
			display: flex;
			gap: 30rpx;
			margin-bottom: 20rpx;
			
			.stat-item {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		.post-actions {
			display: flex;
			gap: 15rpx;
			justify-content: flex-end;
			
			.action-btn {
				padding: 12rpx 24rpx;
				background: #f8f8f8;
				border-radius: 20rpx;
				
				&.danger {
					background: rgba(255, 71, 87, 0.1);
					
					.action-text {
						color: #ff4757;
					}
				}
				
				.action-text {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
		opacity: 0.3;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 40rpx;
	}
	
	.empty-action {
		background: #007aff;
		color: white;
		border: none;
		border-radius: 50rpx;
		padding: 25rpx 50rpx;
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