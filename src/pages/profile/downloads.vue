<template>
	<view class="downloads-container">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view class="filter-item" 
						v-for="(filter, index) in filters" 
						:key="index"
						:class="{ 'active': currentFilter === filter.key }"
						@click="switchFilter(filter.key)">
						<text class="filter-text">{{ filter.name }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-bar">
			<text class="stats-text">共下载了 {{ downloadList.length }} 个文件</text>
			<text class="clear-btn" @click="clearHistory">清空记录</text>
		</view>

		<!-- 下载列表 -->
		<view class="download-list">
			<view class="download-item" v-for="(item, index) in filteredList" :key="index" @click="viewDetail(item)">
				<view class="file-info">
					<text class="file-icon">{{ getFileIcon(item.fileType) }}</text>
					<view class="file-details">
						<text class="file-name">{{ item.fileName }}</text>
						<view class="file-meta">
							<text class="file-size">{{ item.fileSize }}</text>
							<text class="download-time">{{ formatTime(item.downloadTime) }}</text>
						</view>
						<text class="file-uploader">上传者：{{ item.uploaderName }}</text>
					</view>
				</view>
				<view class="action-buttons">
					<view class="action-btn" @click.stop="redownload(item)">
						<text class="btn-text">重新下载</text>
					</view>
					<view class="action-btn delete" @click.stop="deleteRecord(item, index)">
						<text class="btn-text">删除</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="filteredList.length === 0">
			<text class="empty-icon">📁</text>
			<text class="empty-text">{{ currentFilter === 'all' ? '还没有下载任何文件' : '该类型下暂无下载记录' }}</text>
			<text class="empty-desc">去学习资源页面下载资料吧</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentFilter: 'all',
			filters: [
				{ key: 'all', name: '全部' },
				{ key: 'pdf', name: 'PDF文档' },
				{ key: 'doc', name: 'Word文档' },
				{ key: 'ppt', name: 'PPT课件' },
				{ key: 'video', name: '视频' },
				{ key: 'image', name: '图片' },
				{ key: 'zip', name: '压缩包' }
			],
			downloadList: [],
			filteredList: []
		}
	},
	
	onLoad() {
		this.loadDownloadList()
	},
	
	onPullDownRefresh() {
		this.loadDownloadList()
		setTimeout(() => {
			uni.stopPullDownRefresh()
		}, 1000)
	},
	
	methods: {
		async loadDownloadList() {
			try {
				// 模拟数据，实际应调用云函数
				this.downloadList = [
					{
						id: 1,
						fileName: '数据结构与算法课件.pdf',
						fileType: 'pdf',
						fileSize: '12.5MB',
						uploaderName: '张教授',
						downloadTime: new Date('2025-06-20 14:30:00')
					},
					{
						id: 2,
						fileName: '机器学习实验代码.zip',
						fileType: 'zip',
						fileSize: '45.2MB',
						uploaderName: '李同学',
						downloadTime: new Date('2025-06-19 09:15:00')
					},
					{
						id: 3,
						fileName: '软件工程复习资料.docx',
						fileType: 'doc',
						fileSize: '8.7MB',
						uploaderName: '王老师',
						downloadTime: new Date('2025-06-18 16:45:00')
					},
					{
						id: 4,
						fileName: 'Vue.js教学视频.mp4',
						fileType: 'video',
						fileSize: '156.8MB',
						uploaderName: '前端课程组',
						downloadTime: new Date('2025-06-17 11:20:00')
					}
				]
				this.filterDownloads()
			} catch (error) {
				console.error('加载下载记录失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		switchFilter(filterKey) {
			this.currentFilter = filterKey
			this.filterDownloads()
		},
		
		filterDownloads() {
			if (this.currentFilter === 'all') {
				this.filteredList = [...this.downloadList]
			} else {
				this.filteredList = this.downloadList.filter(item => {
					if (this.currentFilter === 'doc') {
						return ['doc', 'docx'].includes(item.fileType)
					} else if (this.currentFilter === 'ppt') {
						return ['ppt', 'pptx'].includes(item.fileType)
					} else if (this.currentFilter === 'image') {
						return ['jpg', 'jpeg', 'png', 'gif'].includes(item.fileType)
					}
					return item.fileType === this.currentFilter
				})
			}
		},
		
		viewDetail(item) {
			uni.navigateTo({
				url: `/pages/resources/detail?id=${item.id}`
			})
		},
		
		redownload(item) {
			uni.showLoading({
				title: '下载中...'
			})
			// 模拟下载
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '下载完成',
					icon: 'success'
				})
			}, 2000)
		},
		
		deleteRecord(item, index) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条下载记录吗？',
				success: (res) => {
					if (res.confirm) {
						this.downloadList.splice(this.downloadList.findIndex(d => d.id === item.id), 1)
						this.filterDownloads()
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
					}
				}
			})
		},
		
		clearHistory() {
			if (this.downloadList.length === 0) {
				uni.showToast({
					title: '暂无记录可清空',
					icon: 'none'
				})
				return
			}
			
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有下载记录吗？此操作不可恢复',
				success: (res) => {
					if (res.confirm) {
						this.downloadList = []
						this.filteredList = []
						uni.showToast({
							title: '清空成功',
							icon: 'success'
						})
					}
				}
			})
		},
		
		getFileIcon(fileType) {
			const iconMap = {
				'pdf': '📄',
				'doc': '📝',
				'docx': '📝',
				'ppt': '📊',
				'pptx': '📊',
				'zip': '📦',
				'rar': '📦',
				'jpg': '🖼️',
				'jpeg': '🖼️',
				'png': '🖼️',
				'gif': '🖼️',
				'video': '🎬',
				'mp4': '🎬'
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
.downloads-container {
	background: #f5f5f5;
	min-height: 100vh;
}

.filter-bar {
	background: white;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	.filter-scroll {
		white-space: nowrap;
		
		.filter-list {
			display: flex;
			padding: 0 30rpx;
			
			.filter-item {
				padding: 12rpx 30rpx;
				margin-right: 20rpx;
				border-radius: 30rpx;
				background: #f8f8f8;
				white-space: nowrap;
				
				&.active {
					background: #007aff;
					
					.filter-text {
						color: white;
					}
				}
				
				.filter-text {
					font-size: 26rpx;
					color: #666;
				}
			}
		}
	}
}

.stats-bar {
	background: white;
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
	
	.stats-text {
		font-size: 26rpx;
		color: #666;
	}
	
	.clear-btn {
		font-size: 26rpx;
		color: #ff3b30;
	}
}

.download-list {
	.download-item {
		background: white;
		padding: 30rpx;
		margin-bottom: 2rpx;
		
		.file-info {
			display: flex;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			.file-icon {
				font-size: 48rpx;
				margin-right: 20rpx;
				line-height: 1;
			}
			
			.file-details {
				flex: 1;
				
				.file-name {
					display: block;
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 10rpx;
				}
				
				.file-meta {
					display: flex;
					margin-bottom: 10rpx;
					
					.file-size {
						font-size: 24rpx;
						color: #666;
						margin-right: 30rpx;
					}
					
					.download-time {
						font-size: 24rpx;
						color: #999;
					}
				}
				
				.file-uploader {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
		
		.action-buttons {
			display: flex;
			justify-content: flex-end;
			
			.action-btn {
				padding: 12rpx 30rpx;
				border-radius: 30rpx;
				margin-left: 20rpx;
				border: 2rpx solid #007aff;
				
				.btn-text {
					font-size: 26rpx;
					color: #007aff;
				}
				
				&.delete {
					border-color: #ff3b30;
					
					.btn-text {
						color: #ff3b30;
					}
				}
			}
		}
	}
}

.empty-state {
	text-align: center;
	padding: 120rpx 60rpx;
	
	.empty-icon {
		display: block;
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}
	
	.empty-text {
		display: block;
		font-size: 32rpx;
		color: #666;
		margin-bottom: 15rpx;
	}
	
	.empty-desc {
		font-size: 26rpx;
		color: #999;
	}
}
</style>