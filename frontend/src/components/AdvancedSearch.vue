<template>
	<view class="advanced-search">
		<!-- 搜索框 -->
		<view class="search-section">
			<view class="search-input-container">
				<input 
					class="search-input" 
					v-model="searchForm.keyword"
					:placeholder="placeholder"
					@input="handleSearchInput"
					@focus="showSuggestions = true"
					@blur="hideSuggestions"
				/>
				<text class="search-icon" @click="performSearch">🔍</text>
			</view>
			
			<!-- 搜索建议 -->
			<view 
				class="search-suggestions" 
				v-if="showSuggestions && suggestions.length > 0"
			>
				<view 
					class="suggestion-item"
					v-for="(suggestion, index) in suggestions"
					:key="index"
					@click="selectSuggestion(suggestion)"
				>
					<text class="suggestion-text">{{ suggestion }}</text>
				</view>
			</view>
			
			<!-- 热门搜索 -->
			<view class="hot-keywords" v-if="showSuggestions && hotKeywords.length > 0">
				<text class="hot-title">热门搜索</text>
				<view class="hot-tags">
					<text 
						class="hot-tag"
						v-for="(keyword, index) in hotKeywords"
						:key="index"
						@click="selectSuggestion(keyword)"
					>
						{{ keyword }}
					</text>
				</view>
			</view>
		</view>

		<!-- 高级筛选 -->
		<view class="filters-section" v-if="showAdvanced">
			<!-- 分类筛选 -->
			<view class="filter-group" v-if="type === 'resource'">
				<text class="filter-title">分类</text>
				<view class="filter-options">
					<view 
						class="filter-option"
						:class="{ active: searchForm.categories.includes(category.id) }"
						v-for="category in categories"
						:key="category.id"
						@click="toggleCategory(category.id)"
					>
						<text class="option-icon">{{ category.icon }}</text>
						<text class="option-text">{{ category.name }}</text>
					</view>
				</view>
			</view>

			<!-- 标签筛选 -->
			<view class="filter-group" v-if="type === 'post'">
				<text class="filter-title">标签</text>
				<view class="tag-logic-selector">
					<text 
						class="logic-option"
						:class="{ active: searchForm.tagLogic === 'OR' }"
						@click="searchForm.tagLogic = 'OR'"
					>
						包含任一
					</text>
					<text 
						class="logic-option"
						:class="{ active: searchForm.tagLogic === 'AND' }"
						@click="searchForm.tagLogic = 'AND'"
					>
						包含所有
					</text>
				</view>
				<view class="filter-options">
					<view 
						class="filter-option tag-option"
						:class="{ active: searchForm.tags.includes(tag.id) }"
						:style="{ backgroundColor: searchForm.tags.includes(tag.id) ? tag.color + '40' : '' }"
						v-for="tag in tags"
						:key="tag.id"
						@click="toggleTag(tag.id)"
					>
						<text class="option-text" :style="{ color: tag.color }">{{ tag.name }}</text>
						<text class="tag-count">({{ tag.count }})</text>
					</view>
				</view>
			</view>

			<!-- 时间范围 -->
			<view class="filter-group">
				<text class="filter-title">时间范围</text>
				<view class="date-range">
					<picker 
						mode="date" 
						:value="searchForm.dateFrom"
						@change="onDateFromChange"
					>
						<view class="date-picker">
							<text class="date-text">{{ searchForm.dateFrom || '开始日期' }}</text>
						</view>
					</picker>
					<text class="date-separator">至</text>
					<picker 
						mode="date" 
						:value="searchForm.dateTo"
						@change="onDateToChange"
					>
						<view class="date-picker">
							<text class="date-text">{{ searchForm.dateTo || '结束日期' }}</text>
						</view>
					</picker>
				</view>
			</view>

			<!-- 评分范围 (仅资源) -->
			<view class="filter-group" v-if="type === 'resource'">
				<text class="filter-title">评分范围</text>
				<view class="range-selector">
					<view class="range-input">
						<text class="range-label">最低评分</text>
						<slider 
							:value="searchForm.minRating * 20"
							@change="onMinRatingChange"
							max="100"
							activeColor="#007aff"
							backgroundColor="#e9e9e9"
						/>
						<text class="range-value">{{ searchForm.minRating.toFixed(1) }}星</text>
					</view>
					<view class="range-input">
						<text class="range-label">最高评分</text>
						<slider 
							:value="searchForm.maxRating * 20"
							@change="onMaxRatingChange"
							max="100"
							activeColor="#007aff"
							backgroundColor="#e9e9e9"
						/>
						<text class="range-value">{{ searchForm.maxRating.toFixed(1) }}星</text>
					</view>
				</view>
			</view>

			<!-- 浏览量范围 -->
			<view class="filter-group">
				<text class="filter-title">浏览量范围</text>
				<view class="range-selector">
					<view class="range-input">
						<text class="range-label">最少浏览</text>
						<input 
							class="range-number-input"
							type="number"
							v-model="searchForm.minViews"
							placeholder="0"
						/>
					</view>
					<view class="range-input">
						<text class="range-label">最多浏览</text>
						<input 
							class="range-number-input"
							type="number"
							v-model="searchForm.maxViews"
							placeholder="不限"
						/>
					</view>
				</view>
			</view>

			<!-- 文件类型 (仅资源) -->
			<view class="filter-group" v-if="type === 'resource'">
				<text class="filter-title">文件类型</text>
				<view class="filter-options">
					<view 
						class="filter-option"
						:class="{ active: searchForm.fileTypes.includes(fileType) }"
						v-for="fileType in fileTypes"
						:key="fileType"
						@click="toggleFileType(fileType)"
					>
						<text class="option-text">{{ fileType }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 排序选择 -->
		<view class="sort-section">
			<text class="sort-title">排序方式</text>
			<view class="sort-options">
				<view 
					class="sort-option"
					:class="{ active: searchForm.sortBy === option.value }"
					v-for="option in sortOptions"
					:key="option.value"
					@click="searchForm.sortBy = option.value"
				>
					<text class="option-text">{{ option.label }}</text>
				</view>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-section">
			<button class="action-btn secondary" @click="resetFilters">重置</button>
			<button class="action-btn secondary" @click="toggleAdvanced">
				{{ showAdvanced ? '收起筛选' : '高级筛选' }}
			</button>
			<button class="action-btn primary" @click="performSearch" :disabled="loading">
				{{ loading ? '搜索中...' : '搜索' }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'AdvancedSearch',
	props: {
		type: {
			type: String,
			default: 'resource', // 'resource' 或 'post'
			validator: value => ['resource', 'post'].includes(value)
		},
		placeholder: {
			type: String,
			default: '搜索内容...'
		},
		loading: {
			type: Boolean,
			default: false
		}
	},
	
	data() {
		return {
			showAdvanced: false,
			showSuggestions: false,
			suggestions: [],
			hotKeywords: [],
			categories: [],
			tags: [],
			fileTypes: [],
			sortOptions: [],
			
			searchForm: {
				keyword: '',
				categories: [],
				tags: [],
				tagLogic: 'OR',
				dateFrom: '',
				dateTo: '',
				minRating: 0,
				maxRating: 5,
				minViews: '',
				maxViews: '',
				fileTypes: [],
				sortBy: 'relevance'
			}
		}
	},
	
	mounted() {
		this.loadFilterOptions()
	},
	
	methods: {
		// 加载筛选选项
		async loadFilterOptions() {
			try {
				const apiUrl = this.type === 'resource' 
					? `${this.$config.apiBaseUrl}/resources/search/filter-options`
					: `${this.$config.apiBaseUrl}/posts/search/filter-options`
				
				const response = await uni.request({
					url: apiUrl,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const data = response.data.data
					
					if (this.type === 'resource') {
						this.categories = data.categories || []
						this.fileTypes = data.fileTypes || []
					} else {
						this.tags = data.tags || []
					}
					
					this.sortOptions = data.sortOptions || []
				}
			} catch (error) {
				console.error('加载筛选选项失败:', error)
			}
		},
		
		// 处理搜索输入
		async handleSearchInput() {
			if (this.searchForm.keyword.length >= 2) {
				await this.loadSuggestions()
			} else {
				this.suggestions = []
			}
		},
		
		// 加载搜索建议
		async loadSuggestions() {
			try {
				const apiUrl = this.type === 'resource' 
					? `${this.$config.apiBaseUrl}/resources/search/suggestions`
					: `${this.$config.apiBaseUrl}/posts/search/suggestions`
				
				const response = await uni.request({
					url: `${apiUrl}?q=${encodeURIComponent(this.searchForm.keyword)}`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.suggestions = response.data.data.suggestions || []
					this.hotKeywords = response.data.data.hotKeywords || []
				}
			} catch (error) {
				console.error('加载搜索建议失败:', error)
			}
		},
		
		// 选择搜索建议
		selectSuggestion(suggestion) {
			this.searchForm.keyword = suggestion
			this.hideSuggestions()
			this.performSearch()
		},
		
		// 隐藏搜索建议
		hideSuggestions() {
			setTimeout(() => {
				this.showSuggestions = false
			}, 200)
		},
		
		// 切换高级筛选
		toggleAdvanced() {
			this.showAdvanced = !this.showAdvanced
		},
		
		// 切换分类选择
		toggleCategory(categoryId) {
			const index = this.searchForm.categories.indexOf(categoryId)
			if (index > -1) {
				this.searchForm.categories.splice(index, 1)
			} else {
				this.searchForm.categories.push(categoryId)
			}
		},
		
		// 切换标签选择
		toggleTag(tagId) {
			const index = this.searchForm.tags.indexOf(tagId)
			if (index > -1) {
				this.searchForm.tags.splice(index, 1)
			} else {
				this.searchForm.tags.push(tagId)
			}
		},
		
		// 切换文件类型选择
		toggleFileType(fileType) {
			const index = this.searchForm.fileTypes.indexOf(fileType)
			if (index > -1) {
				this.searchForm.fileTypes.splice(index, 1)
			} else {
				this.searchForm.fileTypes.push(fileType)
			}
		},
		
		// 日期选择处理
		onDateFromChange(e) {
			this.searchForm.dateFrom = e.detail.value
		},
		
		onDateToChange(e) {
			this.searchForm.dateTo = e.detail.value
		},
		
		// 评分范围处理
		onMinRatingChange(e) {
			this.searchForm.minRating = e.detail.value / 20
		},
		
		onMaxRatingChange(e) {
			this.searchForm.maxRating = e.detail.value / 20
		},
		
		// 重置筛选条件
		resetFilters() {
			this.searchForm = {
				keyword: '',
				categories: [],
				tags: [],
				tagLogic: 'OR',
				dateFrom: '',
				dateTo: '',
				minRating: 0,
				maxRating: 5,
				minViews: '',
				maxViews: '',
				fileTypes: [],
				sortBy: 'relevance'
			}
		},
		
		// 执行搜索
		performSearch() {
			// 构建搜索参数
			const searchParams = {
				search: this.searchForm.keyword,
				sortBy: this.searchForm.sortBy
			}
			
			// 添加分类或标签
			if (this.type === 'resource' && this.searchForm.categories.length > 0) {
				searchParams.categories = this.searchForm.categories.join(',')
			}
			
			if (this.type === 'post') {
				if (this.searchForm.tags.length > 0) {
					searchParams.tags = this.searchForm.tags.join(',')
					searchParams.tagLogic = this.searchForm.tagLogic
				}
			}
			
			// 添加时间范围
			if (this.searchForm.dateFrom) {
				searchParams.dateFrom = this.searchForm.dateFrom
			}
			if (this.searchForm.dateTo) {
				searchParams.dateTo = this.searchForm.dateTo
			}
			
			// 添加评分范围 (仅资源)
			if (this.type === 'resource') {
				if (this.searchForm.minRating > 0) {
					searchParams.minRating = this.searchForm.minRating
				}
				if (this.searchForm.maxRating < 5) {
					searchParams.maxRating = this.searchForm.maxRating
				}
			}
			
			// 添加浏览量范围
			if (this.searchForm.minViews) {
				searchParams.minViews = this.searchForm.minViews
			}
			if (this.searchForm.maxViews) {
				searchParams.maxViews = this.searchForm.maxViews
			}
			
			// 添加文件类型 (仅资源)
			if (this.type === 'resource' && this.searchForm.fileTypes.length > 0) {
				searchParams.fileTypes = this.searchForm.fileTypes.join(',')
			}
			
			// 触发搜索事件
			this.$emit('search', searchParams)
			this.hideSuggestions()
		}
	}
}
</script>

<style lang="scss" scoped>
.advanced-search {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.search-section {
	position: relative;
	margin-bottom: 20rpx;
	
	.search-input-container {
		display: flex;
		align-items: center;
		background: #f8f8f8;
		border-radius: 25rpx;
		padding: 0 20rpx;
		
		.search-input {
			flex: 1;
			height: 80rpx;
			font-size: 28rpx;
			color: #333;
		}
		
		.search-icon {
			font-size: 32rpx;
			color: #007aff;
			padding: 10rpx;
		}
	}
	
	.search-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border-radius: 15rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		z-index: 100;
		max-height: 300rpx;
		overflow-y: auto;
		
		.suggestion-item {
			padding: 20rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			&:active {
				background: #f8f8f8;
			}
			
			.suggestion-text {
				font-size: 26rpx;
				color: #333;
			}
		}
	}
	
	.hot-keywords {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border-radius: 15rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		z-index: 99;
		padding: 20rpx;
		margin-top: 10rpx;
		
		.hot-title {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 15rpx;
		}
		
		.hot-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 10rpx;
			
			.hot-tag {
				padding: 8rpx 16rpx;
				background: rgba(0, 122, 255, 0.1);
				color: #007aff;
				border-radius: 20rpx;
				font-size: 24rpx;
				
				&:active {
					background: rgba(0, 122, 255, 0.2);
				}
			}
		}
	}
}

.filters-section {
	margin-bottom: 20rpx;
	
	.filter-group {
		margin-bottom: 25rpx;
		
		.filter-title {
			display: block;
			font-size: 26rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 15rpx;
		}
		
		.filter-options {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;
			
			.filter-option {
				display: flex;
				align-items: center;
				padding: 12rpx 20rpx;
				background: #f8f8f8;
				border-radius: 25rpx;
				transition: all 0.3s ease;
				
				&.active {
					background: #007aff;
					color: white;
				}
				
				.option-icon {
					margin-right: 8rpx;
					font-size: 20rpx;
				}
				
				.option-text {
					font-size: 24rpx;
				}
				
				&.tag-option .tag-count {
					font-size: 20rpx;
					opacity: 0.7;
					margin-left: 5rpx;
				}
			}
		}
		
		.tag-logic-selector {
			display: flex;
			gap: 10rpx;
			margin-bottom: 15rpx;
			
			.logic-option {
				padding: 8rpx 16rpx;
				background: #f0f0f0;
				border-radius: 20rpx;
				font-size: 24rpx;
				color: #666;
				
				&.active {
					background: #007aff;
					color: white;
				}
			}
		}
		
		.date-range {
			display: flex;
			align-items: center;
			gap: 15rpx;
			
			.date-picker {
				flex: 1;
				padding: 15rpx 20rpx;
				background: #f8f8f8;
				border-radius: 15rpx;
				
				.date-text {
					font-size: 26rpx;
					color: #333;
				}
			}
			
			.date-separator {
				font-size: 24rpx;
				color: #666;
			}
		}
		
		.range-selector {
			.range-input {
				display: flex;
				align-items: center;
				gap: 15rpx;
				margin-bottom: 15rpx;
				
				.range-label {
					width: 120rpx;
					font-size: 24rpx;
					color: #666;
				}
				
				.range-value {
					width: 80rpx;
					font-size: 24rpx;
					color: #007aff;
					text-align: right;
				}
				
				.range-number-input {
					flex: 1;
					padding: 10rpx 15rpx;
					background: #f8f8f8;
					border-radius: 10rpx;
					font-size: 24rpx;
					text-align: center;
				}
			}
		}
	}
}

.sort-section {
	margin-bottom: 25rpx;
	
	.sort-title {
		display: block;
		font-size: 26rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 15rpx;
	}
	
	.sort-options {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		
		.sort-option {
			padding: 12rpx 20rpx;
			background: #f8f8f8;
			border-radius: 25rpx;
			
			&.active {
				background: #007aff;
				color: white;
			}
			
			.option-text {
				font-size: 24rpx;
			}
		}
	}
}

.action-section {
	display: flex;
	gap: 15rpx;
	
	.action-btn {
		flex: 1;
		height: 80rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		border: none;
		
		&.primary {
			background: #007aff;
			color: white;
		}
		
		&.secondary {
			background: #f8f8f8;
			color: #666;
		}
		
		&:disabled {
			opacity: 0.6;
		}
	}
}
</style>