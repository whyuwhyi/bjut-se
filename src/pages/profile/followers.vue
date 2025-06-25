<template>
	<view class="followers-container">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<input class="search-input" placeholder="搜索粉丝" v-model="searchKeyword" @input="onSearch" />
			<text class="search-icon">🔍</text>
		</view>

		<!-- 统计信息 -->
		<view class="stats-bar">
			<text class="stats-text">共有 {{ followersList.length }} 位粉丝</text>
		</view>

		<!-- 粉丝列表 -->
		<view class="followers-list">
			<view class="user-item" v-for="(user, index) in filteredList" :key="index" @click="viewProfile(user)">
				<image class="user-avatar" :src="user.avatar || require('@/static/images/default-avatar.png')" mode="aspectFill"></image>
				<view class="user-info">
					<text class="user-name">{{ user.name }}</text>
					<text class="user-desc">{{ user.description }}</text>
					<view class="user-stats">
						<text class="stat-item">{{ user.followersCount }}粉丝</text>
						<text class="stat-item">{{ user.resourcesCount }}资源</text>
					</view>
				</view>
				<view class="action-btn" @click.stop="toggleFollow(user, index)">
					<text class="btn-text" :class="user.isFollowBack ? 'btn-following' : 'btn-follow'">
						{{ user.isFollowBack ? '已关注' : '回关' }}
					</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="filteredList.length === 0">
			<text class="empty-icon">👥</text>
			<text class="empty-text">{{ searchKeyword ? '未找到相关用户' : '还没有粉丝' }}</text>
			<text class="empty-desc" v-if="!searchKeyword">分享更多优质内容吸引粉丝吧</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			followersList: [],
			filteredList: []
		}
	},
	
	onLoad() {
		this.loadFollowersList()
	},
	
	onPullDownRefresh() {
		this.loadFollowersList()
		setTimeout(() => {
			uni.stopPullDownRefresh()
		}, 1000)
	},
	
	methods: {
		async loadFollowersList() {
			try {
				// 模拟数据，实际应调用云函数
				this.followersList = [
					{
						id: 1,
						name: '小明同学',
						avatar: '',
						description: '计算机专业 · 大二学生',
						followersCount: 234,
						resourcesCount: 12,
						isFollowBack: false
					},
					{
						id: 2,
						name: '小红',
						avatar: '',
						description: '软件工程专业 · 研一学生',
						followersCount: 567,
						resourcesCount: 34,
						isFollowBack: true
					},
					{
						id: 3,
						name: '小华老师',
						avatar: '',
						description: '算法与数据结构讲师',
						followersCount: 1023,
						resourcesCount: 78,
						isFollowBack: false
					}
				]
				this.filteredList = [...this.followersList]
			} catch (error) {
				console.error('加载粉丝列表失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		onSearch() {
			if (this.searchKeyword.trim()) {
				this.filteredList = this.followersList.filter(user => 
					user.name.includes(this.searchKeyword) || 
					user.description.includes(this.searchKeyword)
				)
			} else {
				this.filteredList = [...this.followersList]
			}
		},
		
		viewProfile(user) {
			uni.navigateTo({
				url: `/pages/profile/user-detail?id=${user.id}`
			})
		},
		
		toggleFollow(user, index) {
			if (user.isFollowBack) {
				uni.showModal({
					title: '确认操作',
					content: `确定要取消关注 ${user.name} 吗？`,
					success: (res) => {
						if (res.confirm) {
							user.isFollowBack = false
							uni.showToast({
								title: '已取消关注',
								icon: 'success'
							})
						}
					}
				})
			} else {
				user.isFollowBack = true
				uni.showToast({
					title: '关注成功',
					icon: 'success'
				})
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

.search-bar {
	background: white;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
	
	.search-input {
		flex: 1;
		background: #f8f8f8;
		padding: 20rpx 30rpx;
		border-radius: 30rpx;
		font-size: 28rpx;
		color: #333;
	}
	
	.search-icon {
		font-size: 32rpx;
		color: #999;
		margin-left: 20rpx;
	}
}

.stats-bar {
	background: white;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.stats-text {
		font-size: 26rpx;
		color: #666;
	}
}

.followers-list {
	.user-item {
		background: white;
		padding: 30rpx;
		margin-bottom: 2rpx;
		display: flex;
		align-items: center;
		
		.user-avatar {
			width: 100rpx;
			height: 100rpx;
			border-radius: 50%;
			margin-right: 30rpx;
		}
		
		.user-info {
			flex: 1;
			
			.user-name {
				display: block;
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 10rpx;
			}
			
			.user-desc {
				display: block;
				font-size: 26rpx;
				color: #666;
				margin-bottom: 15rpx;
			}
			
			.user-stats {
				display: flex;
				
				.stat-item {
					font-size: 24rpx;
					color: #999;
					margin-right: 30rpx;
				}
			}
		}
		
		.action-btn {
			.btn-text {
				padding: 12rpx 30rpx;
				border-radius: 30rpx;
				font-size: 26rpx;
				border: 2rpx solid;
				
				&.btn-follow {
					color: #007aff;
					border-color: #007aff;
					background: white;
				}
				
				&.btn-following {
					color: #666;
					border-color: #ddd;
					background: #f8f8f8;
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