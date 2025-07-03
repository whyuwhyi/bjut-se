<template>
	<view>
		<view class="forum-container">
			<!-- 高级搜索组件 -->
			<AdvancedSearch 
				type="post"
				placeholder="搜索帖子..."
				:loading="loading"
				@search="handleAdvancedSearch"
			/>

			<!-- 帖子列表 -->
			<scroll-view 
				class="posts-list"
				refresher-enabled="true"
				:refresher-triggered="refresherTriggered"
				@refresherrefresh="onRefresh"
			>
				<view 
					class="post-item" 
					v-for="(post, index) in posts" 
					:key="post.post_id"
					@click="viewPost(post)"
				>
					<view class="post-header">
						<view class="author-info">
							<image 
								class="avatar" 
								:src="post.author.avatar_url || '/static/images/default-avatar.png'" 
								mode="aspectFill"
								@click.stop="viewUserProfile(post.author.phone_number, post.author)"
							></image>
							<view class="author-details">
								<text class="author-name">{{ post.author.nickname || post.author.name }}</text>
								<text class="post-time">{{ formatTime(post.created_at) }}</text>
							</view>
						</view>
						<view class="post-stats">
							<text class="stat-item">👁️ {{ post.view_count }}</text>
							<text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
							<text class="stat-item">❤️ {{ post.collection_count || 0 }}</text>
						</view>
					</view>
					
					<view class="post-content">
						<text class="post-title">{{ post.title }}</text>
						<text class="post-excerpt">{{ getExcerpt(post.content) }}</text>
					</view>
					
					<view class="post-footer" v-if="post.tags && post.tags.length > 0">
						<view class="post-tags">
							<view 
								class="post-tag" 
								v-for="tag in post.tags" 
								:key="tag.tag_id"
								:style="{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }"
							>
								<text class="tag-name">{{ tag.tag_name }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMore && !loading">
					<button class="load-more-btn" @click="loadMore">加载更多</button>
				</view>
				
				<!-- 加载中提示 -->
				<view class="loading" v-if="loading">
					<text class="loading-text">加载中...</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 发布按钮 - 移到外层 -->
		<view class="create-post-btn" @click="goToCreate">
			<image class="create-icon" src="/static/icons/post.png" mode="aspectFit"></image>
		</view>
	</view>
</template>

<script>
import { navigateToUserProfile } from '@/utils/userUtils'
import config from '@/utils/config'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import eventBus, { EVENTS } from '@/utils/eventBus'

export default {
	components: {
		AdvancedSearch
	},
	
	data() {
		return {
			posts: [],
			loading: false,
			page: 1,
			hasMore: true,
			searchParams: {},
			refresherTriggered: false
		}
	},
	
	onLoad() {
		this.loadPosts()
		this.initEventListeners()
	},
	
	onShow() {
		// 页面显示时重新加载帖子列表，确保数据同步
		this.page = 1
		this.loadPosts(true)
	},
	
	onUnload() {
		this.removeEventListeners()
	},
	
	methods: {
		// 下拉刷新
		async onRefresh() {
			this.refresherTriggered = true
			this.page = 1
			await this.loadPosts(true)
			this.refresherTriggered = false
		},
		
		viewUserProfile(userPhone, userInfo) {
			navigateToUserProfile(userPhone, userInfo)
		},
		
		// 处理高级搜索
		handleAdvancedSearch(searchParams) {
			this.searchParams = searchParams
			this.page = 1
			this.hasMore = true
			this.loadPosts(true)
		},
		
		async loadPosts(refresh = false) {
			if (this.loading) return
			
			try {
				this.loading = true
				
				const params = {
					page: refresh ? 1 : this.page,
					limit: 6,
					...this.searchParams
				}
				
				const response = await uni.request({
					url: `${config.apiBaseUrl}/posts`,
					method: 'GET',
					data: params
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const { posts, pagination } = response.data.data
					
					// 调试：打印原始数据
					console.log('原始帖子数据:', posts)
					
					// 标准化帖子数据，确保所有统计字段都存在且为响应式
					const normalizedPosts = posts.map(post => {
						const normalized = {
							...post,
							// 确保统计字段都存在
							view_count: post.view_count || 0,
							comment_count: post.comment_count || 0,
							collection_count: post.collection_count || 0,
							like_count: post.like_count || 0
						}
						console.log('标准化后的帖子:', normalized)
						return normalized
					})
					
					if (refresh) {
						this.posts = normalizedPosts
						this.page = 1
					} else {
						this.posts = [...this.posts, ...normalizedPosts]
					}
					
					this.hasMore = pagination.currentPage < pagination.totalPages
					this.page = pagination.currentPage + 1
				} else {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载帖子失败:', error)
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
				await this.loadPosts()
			}
		},
		
		
		viewPost(post) {
			uni.navigateTo({
				url: `./detail?id=${post.post_id}`
			})
		},
		
		goToCreate() {
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			uni.navigateTo({
				url: './create'
			})
		},
		
		getExcerpt(content) {
			// 使用改进的摘要提取函数
			const { getPlainTextExcerpt } = require('@/utils/markdown.js')
			return getPlainTextExcerpt(content, 100)
		},
		
		formatTime(time) {
			const { formatTime } = require('@/utils/time.js')
			return formatTime(time)
		},
		
		// 初始化事件监听器
		initEventListeners() {
			eventBus.on(EVENTS.POST_LIKE_CHANGED, this.updatePostLike)
			eventBus.on(EVENTS.POST_FAVORITE_CHANGED, this.updatePostFavorite)
			eventBus.on(EVENTS.POST_VIEW_CHANGED, this.updatePostView)
			eventBus.on(EVENTS.POST_COMMENT_CHANGED, this.updatePostComment)
		},
		
		// 移除事件监听器
		removeEventListeners() {
			eventBus.off(EVENTS.POST_LIKE_CHANGED, this.updatePostLike)
			eventBus.off(EVENTS.POST_FAVORITE_CHANGED, this.updatePostFavorite)
			eventBus.off(EVENTS.POST_VIEW_CHANGED, this.updatePostView)
			eventBus.off(EVENTS.POST_COMMENT_CHANGED, this.updatePostComment)
		},
		
		// 更新帖子点赞数
		updatePostLike(data) {
			const { postId, likeCount } = data
			const postIndex = this.posts.findIndex(p => p.post_id === postId)
			if (postIndex !== -1) {
				this.$set(this.posts[postIndex], 'like_count', likeCount)
			}
		},
		
		// 更新帖子收藏数
		updatePostFavorite(data) {
			const { postId, favoriteCount } = data
			const postIndex = this.posts.findIndex(p => p.post_id === postId)
			if (postIndex !== -1) {
				this.$set(this.posts[postIndex], 'collection_count', favoriteCount)
			}
		},
		
		// 更新帖子浏览数
		updatePostView(data) {
			const { postId, viewCount } = data
			const postIndex = this.posts.findIndex(p => p.post_id === postId)
			if (postIndex !== -1) {
				this.$set(this.posts[postIndex], 'view_count', viewCount)
			}
		},
		
		// 更新帖子评论数
		updatePostComment(data) {
			const { postId, commentCount } = data
			const postIndex = this.posts.findIndex(p => p.post_id === postId)
			if (postIndex !== -1) {
				this.$set(this.posts[postIndex], 'comment_count', commentCount)
			}
		},
		
		// 刷新单个帖子数据（从详情页面返回时调用）
		refreshPostData(data) {
			const { postId, viewCount, commentCount, favoriteCount, likeCount } = data
			const postIndex = this.posts.findIndex(p => p.post_id === postId)
			
			if (postIndex !== -1) {
				const post = this.posts[postIndex]
				
				// 使用 Vue.set 确保响应式更新
				if (viewCount !== undefined) {
					this.$set(post, 'view_count', viewCount)
				}
				if (commentCount !== undefined) {
					this.$set(post, 'comment_count', commentCount)
				}
				if (favoriteCount !== undefined) {
					this.$set(post, 'collection_count', favoriteCount)
				}
				if (likeCount !== undefined) {
					this.$set(post, 'like_count', likeCount)
				}
				
				console.log('已更新帖子数据:', post)
			} else {
				console.log('未找到要更新的帖子:', postId)
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.forum-container {
	width: 100%;
	height: 100vh;
	padding: 20rpx;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow-y: auto;
	box-sizing: border-box;
	position: relative;
}

@keyframes gradientBG {
	0% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
	50% {
		background: linear-gradient(135deg, #FAEED1 0%, #FFF8DB 100%);
	}
	100% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
}

.create-post-btn {
	position: fixed;
	right: 40rpx;
	bottom: 160rpx;
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: rgba(0, 122, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(0, 122, 255, 0.15);
	z-index: 100;
	transition: all 0.3s ease;
	
	.create-icon {
		width: 60rpx;
		height: 60rpx;
	}
	
	&:active {
		transform: scale(0.95);
		background: rgba(0, 122, 255, 0.2);
	}
}

.posts-list {
	width: 100%;
	
	.post-item {
		background: white;
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		width: 100%;
		box-sizing: border-box;
		
		.post-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 16rpx;
			width: 100%;
			
			.author-info {
				display: flex;
				align-items: center;
				flex: 1;
				min-width: 0;
				
				.avatar {
					width: 64rpx;
					height: 64rpx;
					border-radius: 32rpx;
					margin-right: 12rpx;
					flex-shrink: 0;
				}
				
				.author-details {
					flex: 1;
					min-width: 0;
					
					.author-name {
						font-size: 28rpx;
						color: #333;
						font-weight: 500;
						margin-bottom: 4rpx;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						max-width: 100%;
					}
					
					.post-time {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
			
			.post-stats {
				display: flex;
				gap: 12rpx;
				flex-shrink: 0;
				
				.stat-item {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
		
		.post-content {
			margin-bottom: 16rpx;
			width: 100%;
			
			.post-title {
				font-size: 30rpx;
				color: #333;
				font-weight: bold;
				margin-bottom: 8rpx;
				width: 100%;
				word-wrap: break-word;
				word-break: break-all;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}
			
			.post-excerpt {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
				word-wrap: break-word;
				word-break: break-all;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
			}
		}
		
		.post-footer {
			.post-tags {
				display: flex;
				flex-wrap: wrap;
				gap: 8rpx;
				
				.post-tag {
					padding: 4rpx 12rpx;
					border-radius: 16rpx;
					
					.tag-name {
						font-size: 22rpx;
					}
				}
			}
		}
	}
}

.load-more {
	width: 100%;
	padding: 16rpx 0;
	text-align: center;
	
	.load-more-btn {
		display: inline-block;
		padding: 12rpx 24rpx;
		background: #007aff;
		color: white;
		border-radius: 24rpx;
		font-size: 24rpx;
		border: none;
		
		&:active {
			transform: scale(0.98);
			background: #0051d5;
		}
	}
}

.loading {
	width: 100%;
	padding: 16rpx 0;
	text-align: center;
	
	.loading-text {
		font-size: 24rpx;
		color: #999;
	}
}
</style>