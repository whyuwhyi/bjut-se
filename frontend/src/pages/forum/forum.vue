<template>
	<view class="forum-container">
		<!-- 顶部搜索和筛选区域 -->
		<view class="top-section">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索帖子..." v-model="searchKeyword" @input="handleSearch"/>
			</view>
			
			<!-- 标签筛选 -->
			<view class="tag-filter" v-if="tags.length > 0">
				<scroll-view class="tag-scroll" scroll-x="true">
					<view class="tag-list">
						<view 
							class="tag-item" 
							:class="{ active: selectedTag === '' }"
							@click="selectTag('')"
						>
							<text class="tag-text">全部</text>
						</view>
						<view 
							class="tag-item" 
							:class="{ active: selectedTag === tag.tag_name }"
							:style="{ backgroundColor: selectedTag === tag.tag_name ? tag.tag_color : '#f8f8f8' }"
							v-for="tag in tags" 
							:key="tag.tag_id"
							@click="selectTag(tag.tag_name)"
						>
							<text class="tag-text" :style="{ color: selectedTag === tag.tag_name ? '#fff' : '#666' }">
								{{ tag.tag_name }}
							</text>
						</view>
					</view>
				</scroll-view>
			</view>
			
			<!-- 排序选择 -->
			<view class="sort-section">
				<picker :value="selectedSortIndex" :range="sortNames" @change="sortChange">
					<view class="sort-picker">
						<text class="sort-text">{{ sortNames[selectedSortIndex] }}</text>
						<text class="sort-icon">▼</text>
					</view>
				</picker>
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

export default {
	data() {
		return {
			searchKeyword: '',
			selectedTag: '',
			currentSort: 'latest',
			sortOptions: [
				{ label: '最新发布', value: 'latest' },
				{ label: '浏览最多', value: 'view' },
				{ label: '收藏最多', value: 'collection' },
				{ label: '评论最多', value: 'comment' }
			],
			selectedSortIndex: 0,
			posts: [],
			tags: [],
			loading: false,
			page: 1,
			hasMore: true
		}
	},
	
	computed: {
		sortNames() {
			return this.sortOptions.map(sort => sort.label)
		}
	},
	
	onLoad() {
		this.loadTags()
		this.loadPosts()
	},
	
	methods: {
		viewUserProfile(userPhone, userInfo) {
			navigateToUserProfile(userPhone, userInfo)
		},
		
		async loadTags() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/posts/tags`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.tags = response.data.data
				}
			} catch (error) {
				console.error('加载标签失败:', error)
			}
		},
		
		async loadPosts(refresh = false) {
			if (this.loading) return
			
			try {
				this.loading = true
				
				const params = {
					page: refresh ? 1 : this.page,
					limit: 6,
					sortBy: this.currentSort
				}
				
				if (this.searchKeyword) {
					params.search = this.searchKeyword
				}
				
				if (this.selectedTag) {
					params.tag = this.selectedTag
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/posts`,
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
		
		handleSearch() {
			this.page = 1
			this.hasMore = true
			this.loadPosts(true)
		},
		
		selectTag(tagName) {
			this.selectedTag = tagName
			this.page = 1
			this.hasMore = true
			this.loadPosts(true)
		},
		
		sortChange(e) {
			this.selectedSortIndex = e.detail.value
			this.currentSort = this.sortOptions[e.detail.value].value
			this.page = 1
			this.hasMore = true
			this.loadPosts(true)
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
	padding-bottom: 160rpx;
	background: transparent !important;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 1024rpx;
	margin: 0 auto;
	
	&::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
		background-color: #FAEED1;
		background-image: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
		background-size: 400% 400%;
		animation: backgroundPan 15s ease infinite;
	}
}

@keyframes backgroundPan {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
}

.top-section {
	background: white;
	padding: 32rpx;
	border-radius: 24rpx;
	margin-bottom: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	width: 100%;
	box-sizing: border-box;
	
	.search-bar {
		display: flex;
		align-items: center;
		background: #f8f8f8;
		border-radius: 24rpx;
		padding: 0 30rpx;
		margin-bottom: 20rpx;
		
		.search-icon {
			font-size: 32rpx;
			margin-right: 20rpx;
			color: #999;
		}
		
		.search-input {
			flex: 1;
			height: 80rpx;
			font-size: 28rpx;
		}
	}
	
	.tag-filter {
		margin-bottom: 20rpx;
		
		.tag-scroll {
			white-space: nowrap;
			
			.tag-list {
				display: flex;
				gap: 12rpx;
				
				.tag-item {
					padding: 12rpx 24rpx;
					background: #f8f8f8;
					border-radius: 30rpx;
					white-space: nowrap;
					
					&.active {
						background: #007aff;
						
						.tag-text {
							color: white;
						}
					}
					
					.tag-text {
						font-size: 26rpx;
						color: #666;
					}
				}
			}
		}
	}
	
	.sort-section {
		.sort-picker {
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f8f8f8;
			border-radius: 24rpx;
			padding: 15rpx 20rpx;
			
			.sort-text {
				font-size: 26rpx;
				color: #333;
				margin-right: 8rpx;
			}
			
			.sort-icon {
				font-size: 20rpx;
				color: #999;
			}
		}
	}
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