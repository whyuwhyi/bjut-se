<template>
	<view class="detail-container">
		<!-- 通知头部 -->
		<view class="notification-header">
			<view class="header-icon" :class="'icon-' + notification.type">
				<text class="icon-emoji">{{ getNotificationIcon(notification.type) }}</text>
			</view>
			<view class="header-content">
				<text class="notification-title">{{ notification.title }}</text>
				<view class="notification-meta">
					<view class="priority-tag" :class="'tag-' + notification.priority">
						{{ getPriorityText(notification.priority) }}
					</view>
					<text class="sender-name" v-if="notification.senderName">{{ notification.senderName }}</text>
				</view>
				<text class="publish-time">{{ formatTime(notification.createTime) }}</text>
			</view>
		</view>

		<!-- 通知内容 -->
		<view class="notification-body">
			<rich-text class="content-text" :nodes="notification.content"></rich-text>
			
			<!-- 附件列表 -->
			<view class="attachments" v-if="notification.attachments && notification.attachments.length > 0">
				<text class="attachments-title">📎 附件</text>
				<view 
					class="attachment-item" 
					v-for="(attachment, index) in notification.attachments" 
					:key="index"
					@click="openAttachment(attachment)"
				>
					<text class="attachment-icon">{{ getFileIcon(attachment.type) }}</text>
					<view class="attachment-info">
						<text class="attachment-name">{{ attachment.name }}</text>
						<text class="attachment-size">{{ formatFileSize(attachment.size) }}</text>
					</view>
					<text class="download-icon">⬇️</text>
				</view>
			</view>

			<!-- 相关链接 -->
			<view class="related-link" v-if="notification.linkUrl" @click="openLink">
				<text class="link-icon">🔗</text>
				<text class="link-text">查看详情</text>
				<text class="arrow-icon">›</text>
			</view>
		</view>

		<!-- 操作区域 -->
		<view class="action-section">
			<button class="action-btn" :class="{ active: notification.isStarred }" @click="toggleStar">
				<text class="btn-icon">{{ notification.isStarred ? '⭐' : '☆' }}</text>
				<text class="btn-text">{{ notification.isStarred ? '已收藏' : '收藏' }}</text>
			</button>
			
			<button class="action-btn" @click="shareNotification">
				<text class="btn-icon">📤</text>
				<text class="btn-text">分享</text>
			</button>
			
			<button class="action-btn danger" @click="deleteNotification">
				<text class="btn-icon">🗑️</text>
				<text class="btn-text">删除</text>
			</button>
		</view>

		<!-- 确认删除弹窗 -->
		<uni-popup ref="deletePopup" type="dialog">
			<uni-popup-dialog 
				type="warn" 
				title="确认删除" 
				content="删除后无法恢复，确定要删除这条通知吗？"
				:before-close="true"
				@confirm="confirmDelete"
				@close="closeDeleteDialog"
			></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				notificationId: '',
				notification: {
					id: '',
					type: 'system',
					priority: 'medium',
					title: '',
					content: '',
					senderName: '',
					isRead: false,
					isStarred: false,
					createTime: new Date(),
					linkUrl: '',
					attachments: []
				}
			}
		},
		
		onLoad(options) {
			this.notificationId = options.id || '';
			this.loadNotificationDetail();
		},
		
		methods: {
			async loadNotificationDetail() {
				try {
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/notifications/${this.notificationId}`,
						method: 'GET',
						header: {
							'Authorization': `Bearer ${uni.getStorageSync('token')}`
						}
					})
					
					if (!response.data.success) {
						throw new Error(response.data.message || '获取通知详情失败')
					}
					
					const notificationData = response.data.data.notification
					
					// 转换后端数据格式为前端需要的格式
					this.notification = {
						id: notificationData.notification_id,
						type: notificationData.type,
						priority: notificationData.priority,
						title: notificationData.title,
						content: notificationData.content,
						senderName: notificationData.related_user ? notificationData.related_user.name : '',
						isRead: notificationData.is_read,
						isStarred: false, // 目前后端没有收藏功能
						createTime: new Date(notificationData.created_at),
						linkUrl: notificationData.action_url || '',
						attachments: [] // 目前没有附件功能
					}
					
					// 标记为已读
					if (!this.notification.isRead) {
						this.markAsRead()
					}
				} catch (error) {
					console.error('加载通知详情失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
					uni.navigateBack()
				}
			},
			
			async markAsRead() {
				try {
					await uni.request({
						url: `${this.$config.apiBaseUrl}/notifications/${this.notificationId}/read`,
						method: 'PATCH',
						header: {
							'Authorization': `Bearer ${uni.getStorageSync('token')}`
						}
					})
					this.notification.isRead = true
				} catch (error) {
					console.error('标记已读失败:', error)
				}
			},
			
			async toggleStar() {
				try {
					const newStarred = !this.notification.isStarred
					await uni.request({
						url: `${this.$config.apiBaseUrl}/notifications/${this.notificationId}/star`,
						method: newStarred ? 'PUT' : 'DELETE',
						header: {
							'Authorization': `Bearer ${uni.getStorageSync('token')}`
						}
					})
					
					this.notification.isStarred = newStarred
					const message = newStarred ? '已收藏' : '已取消收藏'
					uni.showToast({
						title: message,
						icon: 'success'
					})
				} catch (error) {
					console.error('更新收藏状态失败:', error)
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			},
			
			shareNotification() {
				uni.share({
					provider: 'weixin',
					type: 0,
					title: this.notification.title,
					summary: this.notification.content.replace(/<[^>]*>/g, '').substring(0, 100),
					success: () => {
						uni.showToast({
							title: '分享成功',
							icon: 'success'
						});
					}
				});
			},
			
			deleteNotification() {
				this.$refs.deletePopup.open();
			},
			
			confirmDelete() {
				// 调用API删除通知
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				});
				
				setTimeout(() => {
					uni.navigateBack();
				}, 1000);
			},
			
			closeDeleteDialog() {
				this.$refs.deletePopup.close();
			},
			
			openAttachment(attachment) {
				// 下载或预览附件
				uni.showActionSheet({
					itemList: ['预览', '下载'],
					success: (res) => {
						if (res.tapIndex === 0) {
							// 预览附件
							this.previewAttachment(attachment);
						} else if (res.tapIndex === 1) {
							// 下载附件
							this.downloadAttachment(attachment);
						}
					}
				});
			},
			
			previewAttachment(attachment) {
				// 预览附件逻辑
				console.log('预览附件:', attachment);
			},
			
			async downloadAttachment(attachment) {
				try {
					const token = uni.getStorageSync('token')
					if (!token) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						})
						return
					}
					
					uni.showLoading({ title: '准备下载...' })
					
					// 构造下载URL
					const downloadUrl = attachment.url || attachment.downloadUrl
					if (!downloadUrl) {
						uni.hideLoading()
						uni.showToast({
							title: '下载链接不可用',
							icon: 'none'
						})
						return
					}
					
					// 构造完整的下载URL
					const fullDownloadUrl = downloadUrl.startsWith('http') 
						? downloadUrl 
						: `${this.$config.apiBaseUrl.replace('/api/v1', '')}${downloadUrl}`
					
					uni.hideLoading()
					
					// #ifdef H5
					// H5环境使用fetch下载（支持身份认证）
					fetch(fullDownloadUrl, {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${token}`
						}
					}).then(response => {
						if (!response.ok) {
							throw new Error('下载失败')
						}
						return response.blob()
					}).then(blob => {
						// 创建下载链接
						const url = window.URL.createObjectURL(blob)
						const link = document.createElement('a')
						link.href = url
						link.download = attachment.name || attachment.fileName || 'attachment'
						document.body.appendChild(link)
						link.click()
						document.body.removeChild(link)
						window.URL.revokeObjectURL(url)
					}).catch(error => {
						console.error('下载失败:', error)
						uni.showToast({
							title: '下载失败',
							icon: 'none'
						})
					})
					// #endif
					
					// #ifdef MP-WEIXIN
					// 微信小程序使用下载API
					uni.downloadFile({
						url: fullDownloadUrl,
						header: {
							'Authorization': `Bearer ${token}`
						},
						success: (downloadRes) => {
							if (downloadRes.statusCode === 200) {
								// 在微信小程序中，可以打开文档
								uni.openDocument({
									filePath: downloadRes.tempFilePath,
									success: () => {
										uni.showToast({
											title: '文件已打开',
											icon: 'success'
										})
									},
									fail: () => {
										uni.showToast({
											title: '文件下载完成',
											icon: 'success'
										})
									}
								})
							}
						},
						fail: () => {
							uni.showToast({
								title: '下载失败',
								icon: 'none'
							})
						}
					})
					// #endif
					
					// #ifdef APP-PLUS
					// App环境使用plus下载
					const dtask = plus.downloader.createDownload(fullDownloadUrl, {
						filename: '_downloads/' + (attachment.name || attachment.fileName || 'attachment'),
						headers: {
							'Authorization': `Bearer ${token}`
						}
					}, (download, status) => {
						if (status == 200) {
							uni.showToast({
								title: '下载完成',
								icon: 'success'
							})
							plus.runtime.openFile(download.filename)
						} else {
							uni.showToast({
								title: '下载失败',
								icon: 'none'
							})
						}
					})
					dtask.start()
					// #endif
					
					uni.showToast({
						title: '开始下载',
						icon: 'success'
					})
				} catch (error) {
					console.error('下载附件失败:', error)
					uni.hideLoading()
					uni.showToast({
						title: '下载失败',
						icon: 'none'
					})
				}
			},
			
			openLink() {
				if (this.notification.linkUrl) {
					// #ifdef H5
					window.open(this.notification.linkUrl);
					// #endif
					
					// #ifndef H5
					uni.navigateTo({
						url: `/pages/webview/webview?url=${encodeURIComponent(this.notification.linkUrl)}`
					});
					// #endif
				}
			},
			
			getNotificationIcon(type) {
				const icons = {
					system: '⚙️',
					study: '📚',
					resource: '📁',
					announcement: '📢',
					activity: '🎯'
				};
				
				// 对于互动类型，根据通知内容选择合适的图标
				if (type === 'interaction') {
					if (this.notification.title.includes('关注用户发布')) {
						return this.notification.content.includes('帖子') ? '👥' : '👤'
					} else if (this.notification.title.includes('新的关注者')) {
						return '👋'
					} else if (this.notification.title.includes('收到新评论')) {
						return '💭'
					} else if (this.notification.title.includes('被收藏')) {
						return '❤️'
					}
					return '💬'
				}
				
				return icons[type] || '📢';
			},
			
			getPriorityText(priority) {
				const texts = {
					high: '重要',
					medium: '一般',
					low: '普通'
				};
				return texts[priority] || '一般';
			},
			
			getFileIcon(type) {
				const icons = {
					pdf: '📄',
					doc: '📝',
					docx: '📝',
					xls: '📊',
					xlsx: '📊',
					ppt: '📊',
					pptx: '📊',
					txt: '📄',
					zip: '📦',
					rar: '📦'
				};
				return icons[type] || '📎';
			},
			
			formatFileSize(bytes) {
				if (bytes === 0) return '0 B';
				const k = 1024;
				const sizes = ['B', 'KB', 'MB', 'GB'];
				const i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
			},
			
			formatTime(date) {
				return date.toLocaleString('zh-CN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
			}
		}
	}
</script>

<style scoped>
	.detail-container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	/* 通知头部 */
	.notification-header {
		background-color: #ffffff;
		padding: 32rpx;
		display: flex;
		align-items: flex-start;
		gap: 24rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.header-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-icon.icon-system {
		background-color: #e8f4fd;
	}

	.header-icon.icon-study {
		background-color: #fff2e8;
	}

	.header-icon.icon-interaction {
		background-color: #f0f9ff;
	}

	.header-icon.icon-activity {
		background-color: #f8f0ff;
	}

	.icon-emoji {
		font-size: 36rpx;
	}

	.header-content {
		flex: 1;
	}

	.notification-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333333;
		line-height: 1.4;
		margin-bottom: 16rpx;
	}

	.notification-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 12rpx;
	}

	.priority-tag {
		padding: 6rpx 16rpx;
		border-radius: 12rpx;
		font-size: 22rpx;
		color: #ffffff;
	}

	.priority-tag.tag-high {
		background-color: #ff3b30;
	}

	.priority-tag.tag-medium {
		background-color: #ff9500;
	}

	.priority-tag.tag-low {
		background-color: #34c759;
	}

	.sender-name {
		font-size: 26rpx;
		color: #666666;
	}

	.publish-time {
		font-size: 24rpx;
		color: #999999;
	}

	/* 通知内容 */
	.notification-body {
		background-color: #ffffff;
		margin-top: 16rpx;
		padding: 32rpx;
	}

	.content-text {
		font-size: 30rpx;
		line-height: 1.6;
		color: #333333;
	}

	/* 附件 */
	.attachments {
		margin-top: 32rpx;
		padding-top: 32rpx;
		border-top: 1rpx solid #e0e0e0;
	}

	.attachments-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 16rpx;
	}

	.attachment-item {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.attachment-item:last-child {
		border-bottom: none;
	}

	.attachment-icon {
		font-size: 32rpx;
		margin-right: 16rpx;
	}

	.attachment-info {
		flex: 1;
	}

	.attachment-name {
		font-size: 28rpx;
		color: #333333;
		display: block;
		margin-bottom: 4rpx;
	}

	.attachment-size {
		font-size: 24rpx;
		color: #999999;
	}

	.download-icon {
		font-size: 24rpx;
		color: #007aff;
	}

	/* 相关链接 */
	.related-link {
		margin-top: 32rpx;
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #f8f9fa;
		border-radius: 12rpx;
		border: 1rpx solid #e0e0e0;
	}

	.link-icon {
		font-size: 28rpx;
		margin-right: 12rpx;
	}

	.link-text {
		flex: 1;
		font-size: 28rpx;
		color: #007aff;
	}

	.arrow-icon {
		font-size: 24rpx;
		color: #cccccc;
	}

	/* 操作区域 */
	.action-section {
		background-color: #ffffff;
		margin-top: 16rpx;
		padding: 32rpx;
		display: flex;
		gap: 16rpx;
	}

	.action-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx;
		background-color: #f8f9fa;
		border: 1rpx solid #e0e0e0;
		border-radius: 12rpx;
		color: #666666;
		font-size: 24rpx;
	}

	.action-btn.active {
		background-color: #007aff;
		color: #ffffff;
		border-color: #007aff;
	}

	.action-btn.danger {
		background-color: #ff3b30;
		color: #ffffff;
		border-color: #ff3b30;
	}

	.btn-icon {
		font-size: 32rpx;
		margin-bottom: 8rpx;
	}

	.btn-text {
		font-size: 24rpx;
	}
</style>