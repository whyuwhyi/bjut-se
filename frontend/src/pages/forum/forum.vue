<template>
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
							:src="post.author.avatar_url || '/static/default-avatar.png'" 
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

		<!-- 发布按钮 -->
		<view class="create-btn" @click="goToCreate">
			<image class="create-icon" src="/static/icons/post.png" mode="aspectFit"></image>
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
	padding: 32rpx;
	background: linear-gradient(to bottom, #FFF8DB, #FAEED1);
}
	

.posts-list {
	padding: 0;
	width: 100%;
	box-sizing: border-box;
	
	.post-item {
		background: white;
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		
		.post-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			.author-info {
				display: flex;
				align-items: center;
				
				.avatar {
					width: 60rpx;
					height: 60rpx;
					border-radius: 50%;
					margin-right: 15rpx;
				}
				
				.author-details {
					display: flex;
					flex-direction: column;
					
					.author-name {
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 5rpx;
					}
					
					.post-time {
						font-size: 22rpx;
						color: #999;
					}
				}
			}
			
			.post-stats {
				display: flex;
				gap: 15rpx;
				
				.stat-item {
					font-size: 22rpx;
					color: #999;
				}
			}
		}
		
		.post-content {
			margin-bottom: 20rpx;
			
			.post-title {
				display: block;
				font-size: 32rpx;
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
		
		.post-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.post-tags {
				display: flex;
				gap: 10rpx;
				flex-wrap: wrap;
				flex: 1;
				
				.post-tag {
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					
					.tag-name {
						font-size: 22rpx;
					}
				}
			}
		}
	}
}

.create-btn {
	position: fixed;
	right: 40rpx;
	bottom: 160rpx;
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