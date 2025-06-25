<template>
	<view class="discussion-container">
		<!-- 顶部筛选和排序区域 -->
		<view class="top-control-section">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索讨论内容..." v-model="searchKeyword" @input="handleSearch"/>
			</view>
			
			<!-- 筛选和排序控制 -->
			<view class="control-tabs">
				<!-- 分类筛选标签 -->
				<scroll-view class="filter-scroll" scroll-x="true">
					<view class="filter-tabs">
						<view 
							class="filter-tab" 
							:class="{ active: activeTab === index }"
							v-for="(tab, index) in filterTabs" 
							:key="index"
							@click="switchTab(index)"
						>
							<text class="tab-text">{{ tab.name }}</text>
						</view>
					</view>
				</scroll-view>
				
				<!-- 排序按钮 -->
				<view class="sort-control">
					<view class="sort-btn" @click="showSortModal">
						<text class="sort-text">{{ getSortText() }}</text>
						<text class="sort-icon">🔽</text>
					</view>
				</view>
			</view>
			
			<!-- 活动筛选标签 -->
			<view class="active-filters" v-if="hasActiveFilters()">
				<view class="filter-tag" v-for="tag in getActiveFilterTags()" :key="tag.key" @click="removeFilter(tag)">
					<text class="tag-text">{{ tag.label }}</text>
					<text class="tag-close">✕</text>
				</view>
				<view class="clear-all" @click="clearAllFilters">
					<text>清空筛选</text>
				</view>
			</view>
		</view>

		<!-- 讨论列表 -->
		<view class="discussion-list">
			<view 
				class="discussion-item" 
				v-for="(item, index) in filteredDiscussions" 
				:key="index"
				@click="viewDiscussion(item)"
			>
				<view class="discussion-header">
					<view class="user-info">
						<image class="user-avatar" :src="item.author.avatar"></image>
						<view class="user-details">
							<text class="user-name">{{ item.author.name }}</text>
							<text class="user-level">{{ item.author.level }}</text>
						</view>
					</view>
					<view class="post-time">{{ formatTime(item.createTime) }}</view>
				</view>
				
				<view class="discussion-content">
					<view class="content-header">
						<text class="discussion-title">{{ item.title }}</text>
						<view class="content-tags">
							<text class="tag question" v-if="item.isQuestion">❓ 问题</text>
							<text class="tag urgent" v-if="item.isUrgent">🔥 紧急</text>
							<text class="tag solved" v-if="item.isSolved">✅ 已解决</text>
							<text class="tag category">{{ item.category }}</text>
						</view>
					</view>
					<text class="discussion-summary">{{ item.summary }}</text>
					
					<view class="content-images" v-if="item.images && item.images.length">
						<image 
							class="content-image" 
							v-for="(img, imgIndex) in item.images.slice(0, 3)" 
							:key="imgIndex"
							:src="img"
							mode="aspectFill"
						></image>
						<view class="more-images" v-if="item.images.length > 3">
							<text>+{{ item.images.length - 3 }}</text>
						</view>
					</view>
				</view>
				
				<view class="discussion-stats">
					<view class="stat-item">
						<text class="stat-icon">👁️</text>
						<text class="stat-text">{{ item.viewCount }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-icon">💬</text>
						<text class="stat-text">{{ item.replyCount }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-icon">👍</text>
						<text class="stat-text">{{ item.likeCount }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-icon">⭐</text>
						<text class="stat-text">{{ item.favoriteCount }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 发布按钮 -->
		<view class="post-btn" @click="goToPost">
			<text class="post-icon">✏️</text>
		</view>

	</view>
</template>

<script>
export default {
	data() {
		return {
			activeTab: 0,
			filterTabs: [
				{ name: '全部', value: 'all' },
				{ name: '问题', value: 'question' },
				{ name: '分享', value: 'share' },
				{ name: '讨论', value: 'discussion' },
				{ name: '已解决', value: 'solved' }
			],
			searchKeyword: '',
			currentSort: 'latest',
			sortOptions: [
				{ label: '最新发布', value: 'latest', icon: '🕒' },
				{ label: '最多回复', value: 'replies', icon: '💬' },
				{ label: '最多点赞', value: 'likes', icon: '👍' },
				{ label: '最多收藏', value: 'favorites', icon: '⭐' }
			],
			discussions: [
				{
					id: 1,
					title: '关于数据库设计的几个问题，求大神指导',
					summary: '在设计用户表的时候遇到了一些问题，主要是关于外键约束和索引优化方面，希望有经验的同学能给一些建议...',
					author: {
						name: '张同学',
						level: 'LV.3',
						avatar: require('@/static/logo.png')
					},
					category: '数据库',
					isQuestion: true,
					isUrgent: false,
					isSolved: false,
					createTime: new Date('2025-06-19'),
					viewCount: 128,
					replyCount: 15,
					likeCount: 23,
					favoriteCount: 8,
					images: []
				},
				{
					id: 2,
					title: '分享一个Vue.js学习心得和项目实战经验',
					summary: '最近用Vue开发了一个完整的项目，踩了不少坑，也总结了一些经验，分享给大家，希望对初学者有帮助。包含组件设计、状态管理、路由配置等方面...',
					author: {
						name: '李同学',
						level: 'LV.5',
						avatar: require('@/static/logo.png')
					},
					category: '前端开发',
					isQuestion: false,
					isUrgent: false,
					isSolved: false,
					createTime: new Date('2025-06-18'),
					viewCount: 89,
					replyCount: 12,
					likeCount: 45,
					favoriteCount: 18,
					images: [require('@/static/logo.png'), require('@/static/logo.png')]
				},
				{
					id: 3,
					title: '紧急求助：如何优化SQL查询性能？明天就要交作业了',
					summary: '我的查询语句执行时间很长，表数据量大概有10万条，请问有什么优化方法吗？已经试过添加索引但效果不明显...',
					author: {
						name: '王同学',
						level: 'LV.2',
						avatar: require('@/static/logo.png')
					},
					category: '数据库',
					isQuestion: true,
					isUrgent: true,
					isSolved: true,
					createTime: new Date('2025-06-17'),
					viewCount: 256,
					replyCount: 28,
					likeCount: 34,
					favoriteCount: 12,
					images: [require('@/static/logo.png'), require('@/static/logo.png'), require('@/static/logo.png'), require('@/static/logo.png')]
				}
			],
			filteredDiscussions: []
		}
	},
	
	onLoad() {
		this.filteredDiscussions = this.discussions
		this.sortDiscussions()
	},
	
	methods: {
		switchTab(index) {
			this.activeTab = index
			this.filterDiscussions()
		},
		
		handleSearch() {
			this.filterDiscussions()
		},
		
		filterDiscussions() {
			let filtered = this.discussions
			
			// 标签筛选
			const tabValue = this.filterTabs[this.activeTab].value
			if (tabValue !== 'all') {
				switch (tabValue) {
					case 'question':
						filtered = filtered.filter(item => item.isQuestion)
						break
					case 'share':
						filtered = filtered.filter(item => !item.isQuestion && item.category === '经验分享')
						break
					case 'discussion':
						filtered = filtered.filter(item => !item.isQuestion)
						break
					case 'solved':
						filtered = filtered.filter(item => item.isSolved)
						break
				}
			}
			
			// 搜索筛选
			if (this.searchKeyword) {
				filtered = filtered.filter(item => 
					item.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
					item.summary.toLowerCase().includes(this.searchKeyword.toLowerCase())
				)
			}
			
			// 排序并更新列表
			this.sortDiscussions(filtered)
		},
		
		getSortText() {
			const sort = this.sortOptions.find(s => s.value === this.currentSort)
			return sort ? sort.label : '排序'
		},
		
		hasActiveFilters() {
			return this.activeTab > 0
		},
		
		getActiveFilterTags() {
			const tags = []
			
			if (this.activeTab > 0) {
				tags.push({
					key: 'filter',
					label: this.filterTabs[this.activeTab].name,
					type: 'filter'
				})
			}
			
			return tags
		},
		
		removeFilter(tag) {
			if (tag.type === 'filter') {
				this.activeTab = 0
				this.filterDiscussions()
			}
		},
		
		clearAllFilters() {
			this.activeTab = 0
			this.filterDiscussions()
		},
		
		sortDiscussions(discussions) {
			switch (this.currentSort) {
				case 'latest':
					discussions.sort((a, b) => b.createTime - a.createTime)
					break
				case 'replies':
					discussions.sort((a, b) => b.replyCount - a.replyCount)
					break
				case 'likes':
					discussions.sort((a, b) => b.likeCount - a.likeCount)
					break
				case 'favorites':
					discussions.sort((a, b) => b.favoriteCount - a.favoriteCount)
					break
			}
			
			this.filteredDiscussions = discussions
		},
		
		showSortModal() {
			uni.showActionSheet({
				itemList: this.sortOptions.map(sort => sort.label),
				success: (res) => {
					this.currentSort = this.sortOptions[res.tapIndex].value
					this.filterDiscussions()
				}
			})
		},
		
		
		viewDiscussion(item) {
			uni.navigateTo({
				url: `./detail?id=${item.id}`
			})
		},
		
		goToPost() {
			uni.navigateTo({
				url: './post'
			})
		},
		
		formatTime(time) {
			const now = new Date()
			const diff = now - time
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return time.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.discussion-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

.top-control-section {
	background: white;
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.search-bar {
		display: flex;
		align-items: center;
		background: #f8f8f8;
		border-radius: 50rpx;
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
	
	.control-tabs {
		display: flex;
		align-items: center;
		gap: 20rpx;
		
		.filter-scroll {
			flex: 1;
			white-space: nowrap;
			
			.filter-tabs {
				display: flex;
				gap: 12rpx;
				
				.filter-tab {
					padding: 12rpx 24rpx;
					background: #f8f8f8;
					border-radius: 30rpx;
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
				}
			}
		}
		
		.sort-control {
			.sort-btn {
				display: flex;
				align-items: center;
				padding: 12rpx 16rpx;
				background: #e3f2fd;
				border-radius: 30rpx;
				min-width: 100rpx;
				
				.sort-text {
					font-size: 24rpx;
					color: #1976d2;
					margin-right: 8rpx;
				}
				
				.sort-icon {
					font-size: 20rpx;
					color: #1976d2;
				}
			}
		}
	}
	
	.active-filters {
		display: flex;
		align-items: center;
		gap: 12rpx;
		margin-top: 20rpx;
		flex-wrap: wrap;
		
		.filter-tag {
			display: flex;
			align-items: center;
			background: #007aff;
			color: white;
			padding: 8rpx 16rpx;
			border-radius: 20rpx;
			
			.tag-text {
				font-size: 22rpx;
				margin-right: 8rpx;
			}
			
			.tag-close {
				font-size: 20rpx;
				font-weight: bold;
			}
		}
		
		.clear-all {
			padding: 8rpx 16rpx;
			background: #ff4757;
			color: white;
			border-radius: 20rpx;
			font-size: 22rpx;
		}
	}
}

.discussion-list {
	padding: 20rpx;
	
	.discussion-item {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.discussion-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			
			.user-info {
				display: flex;
				align-items: center;
				
				.user-avatar {
					width: 60rpx;
					height: 60rpx;
					border-radius: 50%;
					margin-right: 20rpx;
				}
				
				.user-details {
					.user-name {
						display: block;
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 5rpx;
					}
					
					.user-level {
						font-size: 22rpx;
						color: #999;
						background: #f0f0f0;
						padding: 4rpx 12rpx;
						border-radius: 10rpx;
					}
				}
			}
			
			.post-time {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		.discussion-content {
			margin-bottom: 25rpx;
			
			.content-header {
				margin-bottom: 15rpx;
				
				.discussion-title {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					line-height: 1.4;
					margin-bottom: 15rpx;
				}
				
				.content-tags {
					display: flex;
					flex-wrap: wrap;
					
					.tag {
						padding: 6rpx 12rpx;
						border-radius: 15rpx;
						font-size: 22rpx;
						margin-right: 15rpx;
						margin-bottom: 10rpx;
						
						&.question {
							background: #e3f2fd;
							color: #1976d2;
						}
						
						&.urgent {
							background: #ffebee;
							color: #f44336;
						}
						
						&.solved {
							background: #e8f5e8;
							color: #4caf50;
						}
						
						&.category {
							background: #f3e5f5;
							color: #9c27b0;
						}
					}
				}
			}
			
			.discussion-summary {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
				margin-bottom: 20rpx;
			}
			
			.content-images {
				display: flex;
				flex-wrap: wrap;
				gap: 10rpx;
				
				.content-image {
					width: 120rpx;
					height: 120rpx;
					border-radius: 10rpx;
				}
				
				.more-images {
					width: 120rpx;
					height: 120rpx;
					background: rgba(0, 0, 0, 0.1);
					border-radius: 10rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 24rpx;
					color: #666;
				}
			}
		}
		
		.discussion-stats {
			display: flex;
			justify-content: space-between;
			
			.stat-item {
				display: flex;
				align-items: center;
				
				.stat-icon {
					font-size: 28rpx;
					margin-right: 8rpx;
				}
				
				.stat-text {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}
}

.post-btn {
	position: fixed;
	right: 40rpx;
	bottom: 160rpx;
	width: 120rpx;
	height: 120rpx;
	background: linear-gradient(45deg, #667eea, #764ba2);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.4);
	z-index: 100;
	
	.post-icon {
		font-size: 40rpx;
		color: white;
	}
}

</style>