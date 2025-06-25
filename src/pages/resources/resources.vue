<template>
	<view class="resources-container">
		<!-- 顶部筛选区域 -->
		<view class="top-filter-section">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索学习资源..." v-model="searchKeyword" @input="handleSearch"/>
			</view>
			
			<!-- 快速筛选栏 -->
			<view class="quick-filters">
				<!-- 分类筛选 -->
				<scroll-view class="category-scroll" scroll-x="true">
					<view class="category-list">
						<view 
							class="category-item" 
							:class="{ active: selectedCategory === index }"
							v-for="(category, index) in categories" 
							:key="index"
							@click="selectCategory(index)"
						>
							<text class="category-text">{{ category.name }}</text>
						</view>
					</view>
				</scroll-view>
				
				<!-- 文件类型和排序按钮 -->
				<view class="filter-controls">
					<view class="filter-btn" @click="showFileTypeModal">
						<text class="filter-text">类型</text>
						<text class="filter-icon">📁</text>
					</view>
					<view class="filter-btn" @click="showDifficultyModal">
						<text class="filter-text">难度</text>
						<text class="filter-icon">⭐</text>
					</view>
					<view class="sort-btn" @click="showSortModal">
						<text class="sort-text">{{ getSortText() }}</text>
						<text class="sort-icon">🔽</text>
					</view>
				</view>
			</view>
			
			<!-- 活动筛选标签显示 -->
			<view class="active-filters" v-if="hasActiveFilters()">
				<view class="filter-tag" v-for="tag in getActiveFilterTags()" :key="tag.key" @click="removeFilter(tag)">
					<text class="tag-text">{{ tag.label }}</text>
					<text class="tag-close">✕</text>
				</view>
				<view class="clear-all" @click="clearAllFilters">
					<text>清空</text>
				</view>
			</view>
		</view>

		<!-- 资源列表 -->
		<view class="resources-list">
			<view 
				class="resource-item" 
				v-for="(item, index) in filteredResources" 
				:key="index"
				@click="viewResource(item)"
			>
				<view class="resource-header">
					<view class="file-preview">
						<image class="thumbnail-image" :src="item.thumbnail" mode="aspectFill"></image>
						<text class="file-type-overlay">{{ getFileIcon(item.fileType) }}</text>
					</view>
					<view class="resource-info">
						<text class="resource-title">{{ item.title }}</text>
						<view class="resource-tags">
							<text class="tag">{{ item.category }}</text>
							<text class="tag difficulty" :class="'level-' + item.difficulty">{{ item.difficultyText }}</text>
						</view>
					</view>
					<view class="resource-actions">
						<view class="action-btn" @click.stop="toggleFavorite(item)">
							<text class="action-icon" :class="{ favorited: item.isFavorited }">{{ item.isFavorited ? '❤️' : '🤍' }}</text>
						</view>
					</view>
				</view>
				
				<view class="resource-meta">
					<view class="meta-info">
						<text class="author">👤 {{ item.uploaderName }}</text>
						<text class="upload-time">🕒 {{ formatTime(item.uploadTime) }}</text>
					</view>
					<view class="resource-stats">
						<text class="stat-item">👁️ {{ item.viewCount }}</text>
						<text class="stat-item">⬇️ {{ item.downloadCount }}</text>
						<text class="stat-item">⭐ {{ item.rating }}</text>
					</view>
				</view>
				
				<view class="resource-description">
					<text class="description-text">{{ item.description }}</text>
				</view>
			</view>
		</view>

		<!-- 上传按钮 -->
		<view class="upload-btn" @click="goToUpload">
			<text class="upload-icon">📤</text>
		</view>

	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			selectedCategory: 0,
			currentSort: 'latest',
			categories: [
				{ name: '全部', value: 'all' },
				{ name: '课件', value: 'courseware' },
				{ name: '作业', value: 'homework' },
				{ name: '实验', value: 'experiment' },
				{ name: '考试', value: 'exam' },
				{ name: '项目', value: 'project' },
				{ name: '论文', value: 'paper' }
			],
			sortOptions: [
				{ label: '最新上传', value: 'latest' },
				{ label: '下载最多', value: 'download' },
				{ label: '评分最高', value: 'rating' },
				{ label: '浏览最多', value: 'view' }
			],
			resources: [
				{
					id: 1,
					title: '数据结构与算法 - 第一章课件',
					description: '包含基础概念、时间复杂度分析、常用数据结构介绍等内容',
					fileType: 'pdf',
					category: '课件',
					difficulty: 1,
					difficultyText: '入门',
					uploaderName: '张教授',
					uploadTime: new Date('2025-06-15'),
					viewCount: 256,
					downloadCount: 128,
					rating: 4.8,
					isFavorited: false,
					thumbnail: require('@/static/logo.png')
				},
				{
					id: 2,
					title: '机器学习实验代码包',
					description: '包含线性回归、决策树、SVM等经典算法的完整实现代码',
					fileType: 'zip',
					category: '实验',
					difficulty: 3,
					difficultyText: '高级',
					uploaderName: '李同学',
					uploadTime: new Date('2025-06-14'),
					viewCount: 189,
					downloadCount: 67,
					rating: 4.6,
					isFavorited: true,
					thumbnail: require('@/static/logo.png')
				},
				{
					id: 3,
					title: '软件工程期末复习资料',
					description: '涵盖软件开发生命周期、设计模式、项目管理等重点知识',
					fileType: 'doc',
					category: '考试',
					difficulty: 2,
					difficultyText: '中级',
					uploaderName: '王老师',
					uploadTime: new Date('2025-06-13'),
					viewCount: 342,
					downloadCount: 198,
					rating: 4.9,
					isFavorited: false,
					thumbnail: require('@/static/logo.png')
				}
			],
			filteredResources: [],
			filterOptions: {
				fileTypes: [],
				difficulties: []
			},
			fileTypes: [
				{ label: 'PDF文档', value: 'pdf' },
				{ label: 'Word文档', value: 'doc' },
				{ label: 'PPT演示', value: 'ppt' },
				{ label: '压缩包', value: 'zip' },
				{ label: '视频', value: 'video' }
			],
			difficulties: [
				{ label: '入门', value: 1 },
				{ label: '中级', value: 2 },
				{ label: '高级', value: 3 }
			]
		}
	},
	
	onLoad() {
		this.filteredResources = this.resources
	},
	
	methods: {
		handleSearch() {
			this.filterResources()
		},
		
		selectCategory(index) {
			this.selectedCategory = index
			this.filterResources()
		},
		
		filterResources() {
			let filtered = this.resources
			
			// 分类筛选
			if (this.selectedCategory > 0) {
				const categoryValue = this.categories[this.selectedCategory].value
				filtered = filtered.filter(item => item.category === this.categories[this.selectedCategory].name)
			}
			
			// 搜索筛选
			if (this.searchKeyword) {
				filtered = filtered.filter(item => 
					item.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
					item.description.toLowerCase().includes(this.searchKeyword.toLowerCase())
				)
			}
			
			// 文件类型筛选
			if (this.filterOptions.fileTypes.length > 0) {
				filtered = filtered.filter(item => this.filterOptions.fileTypes.includes(item.fileType))
			}
			
			// 难度筛选
			if (this.filterOptions.difficulties.length > 0) {
				filtered = filtered.filter(item => this.filterOptions.difficulties.includes(item.difficulty))
			}
			
			this.filteredResources = filtered
			this.sortResources()
		},
		
		showFileTypeModal() {
			uni.showActionSheet({
				itemList: this.fileTypes.map(type => type.label),
				success: (res) => {
					const selectedType = this.fileTypes[res.tapIndex].value
					this.toggleFileType(selectedType)
					this.filterResources()
				}
			})
		},
		
		showDifficultyModal() {
			uni.showActionSheet({
				itemList: this.difficulties.map(diff => diff.label),
				success: (res) => {
					const selectedDiff = this.difficulties[res.tapIndex].value
					this.toggleDifficulty(selectedDiff)
					this.filterResources()
				}
			})
		},
		
		showSortModal() {
			uni.showActionSheet({
				itemList: this.sortOptions.map(sort => sort.label),
				success: (res) => {
					this.currentSort = this.sortOptions[res.tapIndex].value
					this.sortResources()
				}
			})
		},
		
		getSortText() {
			const sort = this.sortOptions.find(s => s.value === this.currentSort)
			return sort ? sort.label : '排序'
		},
		
		hasActiveFilters() {
			return this.filterOptions.fileTypes.length > 0 || 
				   this.filterOptions.difficulties.length > 0 ||
				   this.selectedCategory > 0
		},
		
		getActiveFilterTags() {
			const tags = []
			
			// 分类标签
			if (this.selectedCategory > 0) {
				tags.push({
					key: 'category',
					label: this.categories[this.selectedCategory].name,
					type: 'category'
				})
			}
			
			// 文件类型标签
			this.filterOptions.fileTypes.forEach(type => {
				const fileType = this.fileTypes.find(f => f.value === type)
				if (fileType) {
					tags.push({
						key: `filetype_${type}`,
						label: fileType.label,
						type: 'fileType',
						value: type
					})
				}
			})
			
			// 难度标签
			this.filterOptions.difficulties.forEach(diff => {
				const difficulty = this.difficulties.find(d => d.value === diff)
				if (difficulty) {
					tags.push({
						key: `difficulty_${diff}`,
						label: difficulty.label,
						type: 'difficulty',
						value: diff
					})
				}
			})
			
			return tags
		},
		
		removeFilter(tag) {
			if (tag.type === 'category') {
				this.selectedCategory = 0
			} else if (tag.type === 'fileType') {
				this.toggleFileType(tag.value)
			} else if (tag.type === 'difficulty') {
				this.toggleDifficulty(tag.value)
			}
			this.filterResources()
		},
		
		clearAllFilters() {
			this.selectedCategory = 0
			this.filterOptions = {
				fileTypes: [],
				difficulties: []
			}
			this.filterResources()
		},
		
		sortResources() {
			let sorted = [...this.filteredResources]
			
			switch (this.currentSort) {
				case 'download':
					sorted.sort((a, b) => b.downloadCount - a.downloadCount)
					break
				case 'rating':
					sorted.sort((a, b) => b.rating - a.rating)
					break
				case 'view':
					sorted.sort((a, b) => b.viewCount - a.viewCount)
					break
				case 'latest':
				default:
					sorted.sort((a, b) => b.uploadTime - a.uploadTime)
					break
			}
			
			this.filteredResources = sorted
		},
		
		toggleFileType(type) {
			const index = this.filterOptions.fileTypes.indexOf(type)
			if (index > -1) {
				this.filterOptions.fileTypes.splice(index, 1)
			} else {
				this.filterOptions.fileTypes.push(type)
			}
		},
		
		toggleDifficulty(difficulty) {
			const index = this.filterOptions.difficulties.indexOf(difficulty)
			if (index > -1) {
				this.filterOptions.difficulties.splice(index, 1)
			} else {
				this.filterOptions.difficulties.push(difficulty)
			}
		},
		
		
		toggleFavorite(item) {
			item.isFavorited = !item.isFavorited
			uni.showToast({
				title: item.isFavorited ? '已收藏' : '已取消收藏',
				icon: 'none'
			})
		},
		
		viewResource(item) {
			uni.navigateTo({
				url: `./detail?id=${item.id}`
			})
		},
		
		goToUpload() {
			uni.navigateTo({
				url: './upload'
			})
		},
		
		getFileIcon(fileType) {
			const iconMap = {
				'pdf': '📄',
				'doc': '📝',
				'ppt': '📊',
				'zip': '📦',
				'video': '🎥'
			}
			return iconMap[fileType] || '📁'
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
.resources-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

.top-filter-section {
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
	
	.quick-filters {
		display: flex;
		align-items: center;
		gap: 20rpx;
		
		.category-scroll {
			flex: 1;
			white-space: nowrap;
			
			.category-list {
				display: flex;
				gap: 12rpx;
				
				.category-item {
					padding: 12rpx 24rpx;
					background: #f8f8f8;
					border-radius: 30rpx;
					white-space: nowrap;
					
					&.active {
						background: #007aff;
						
						.category-text {
							color: white;
						}
					}
					
					.category-text {
						font-size: 26rpx;
						color: #666;
					}
				}
			}
		}
		
		.filter-controls {
			display: flex;
			gap: 12rpx;
			
			.filter-btn, .sort-btn {
				display: flex;
				align-items: center;
				padding: 12rpx 16rpx;
				background: #f8f8f8;
				border-radius: 30rpx;
				min-width: 80rpx;
				
				.filter-text, .sort-text {
					font-size: 24rpx;
					color: #666;
					margin-right: 8rpx;
				}
				
				.filter-icon, .sort-icon {
					font-size: 20rpx;
					color: #999;
				}
			}
			
			.sort-btn {
				background: #e3f2fd;
				
				.sort-text {
					color: #1976d2;
				}
				
				.sort-icon {
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

.resources-list {
	padding: 20rpx;
	
	.resource-item {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.resource-header {
			display: flex;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			.file-preview {
				position: relative;
				width: 80rpx;
				height: 80rpx;
				margin-right: 20rpx;
				border-radius: 12rpx;
				overflow: hidden;
				
				.thumbnail-image {
					width: 100%;
					height: 100%;
					background: #f0f0f0;
				}
				
				.file-type-overlay {
					position: absolute;
					bottom: 2rpx;
					right: 2rpx;
					font-size: 20rpx;
					background: rgba(0, 0, 0, 0.6);
					color: white;
					padding: 4rpx 6rpx;
					border-radius: 6rpx;
				}
			}
			
			.resource-info {
				flex: 1;
				
				.resource-title {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 15rpx;
					line-height: 1.4;
				}
				
				.resource-tags {
					display: flex;
					flex-wrap: wrap;
					
					.tag {
						padding: 8rpx 16rpx;
						background: #e3f2fd;
						color: #1976d2;
						border-radius: 20rpx;
						font-size: 22rpx;
						margin-right: 15rpx;
						margin-bottom: 10rpx;
						
						&.difficulty {
							&.level-1 {
								background: #e8f5e8;
								color: #4caf50;
							}
							
							&.level-2 {
								background: #fff3e0;
								color: #ff9800;
							}
							
							&.level-3 {
								background: #ffebee;
								color: #f44336;
							}
						}
					}
				}
			}
			
			.resource-actions {
				.action-btn {
					padding: 10rpx;
					
					.action-icon {
						font-size: 32rpx;
						
						&.favorited {
							color: #ff4757;
						}
					}
				}
			}
		}
		
		.resource-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			
			.meta-info {
				display: flex;
				flex-direction: column;
				
				.author, .upload-time {
					font-size: 24rpx;
					color: #666;
					margin-bottom: 8rpx;
				}
			}
			
			.resource-stats {
				display: flex;
				
				.stat-item {
					font-size: 24rpx;
					color: #999;
					margin-left: 30rpx;
				}
			}
		}
		
		.resource-description {
			.description-text {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
			}
		}
	}
}

.upload-btn {
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
	
	.upload-icon {
		font-size: 40rpx;
		color: white;
	}
}

</style>