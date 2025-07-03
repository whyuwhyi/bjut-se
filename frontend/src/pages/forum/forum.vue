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
		<view class="posts-list">
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
		
		<!-- 发布按钮 -->
		<view class="create-post-btn" @click="goToCreate">
			<image class="create-icon" src="/static/icons/post.png" mode="aspectFit"></image>
		</view>
	</view>
</template>

<script>
import { navigateToUserProfile } from '@/utils/userUtils'
import config from '@/utils/config'
import AdvancedSearch from '@/components/AdvancedSearch.vue'

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
			searchParams: {}
		}
	},
	
	onLoad() {
		this.loadPosts()
	},
	
	methods: {
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
					
					if (refresh) {
						this.posts = posts
						this.page = 1
					} else {
						this.posts = [...this.posts, ...posts]
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
		}
	}
}
</script>

<style lang="scss" scoped>
.forum-container {
	min-height: 100vh;
	padding: 20rpx;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
	width: 100%;
	box-sizing: border-box;
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
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				display: block;
			}
			
			.post-excerpt {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
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

.create-post-btn {
	position: fixed;
	right: 40rpx;
	bottom: 120rpx;
	width: 120rpx;
	height: 120rpx;
	background: rgba(0, 122, 255, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(0, 122, 255, 0.15);
	z-index: 100;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.95);
		background: rgba(0, 122, 255, 0.2);
	}
	
	.create-icon {
		width: 60rpx;
		height: 60rpx;
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
			background: darken(#007aff, 5%);
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