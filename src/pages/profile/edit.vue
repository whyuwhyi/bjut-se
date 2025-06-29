<template>
	<view class="edit-container">
		<!-- 头像编辑 -->
		<view class="avatar-section">
			<text class="section-title">头像</text>
			<view class="avatar-edit">
				<image class="current-avatar" :src="userInfo.avatar || require('@/static/images/default-avatar.png')" mode="aspectFill"></image>
				<view class="avatar-actions">
					<view class="action-btn" @click="chooseAvatar">
						<text class="btn-text">更换头像</text>
					</view>
					<view class="action-btn secondary" @click="removeAvatar" v-if="userInfo.avatar">
						<text class="btn-text">移除头像</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 基本信息 -->
		<view class="info-section">
			<text class="section-title">基本信息</text>
			<view class="form-group">
				<view class="form-item">
					<text class="label">昵称</text>
					<input class="input-field" v-model="userInfo.nickname" placeholder="请输入昵称" :maxlength="20" />
				</view>
				
				<view class="form-item">
					<text class="label">性别</text>
					<picker class="picker-field" :value="genderIndex" :range="genderOptions" @change="onGenderChange">
						<view class="picker-content">
							<text class="picker-text">{{ genderOptions[genderIndex] }}</text>
							<text class="picker-arrow">></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="label">生日</text>
					<picker class="picker-field" mode="date" :value="userInfo.birthday" @change="onBirthdayChange">
						<view class="picker-content">
							<text class="picker-text">{{ userInfo.birthday || '请选择生日' }}</text>
							<text class="picker-arrow">></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="label">手机号</text>
					<input class="input-field" v-model="userInfo.phone" placeholder="请输入手机号" type="number" :maxlength="11" />
				</view>
				
				<view class="form-item">
					<text class="label">邮箱</text>
					<input class="input-field" v-model="userInfo.email" placeholder="请输入邮箱" type="email" />
				</view>
			</view>
		</view>

		<!-- 学业信息 -->
		<view class="academic-section">
			<text class="section-title">学业信息</text>
			<view class="form-group">
				<view class="form-item">
					<text class="label">学院</text>
					<picker class="picker-field" :value="collegeIndex" :range="collegeOptions" @change="onCollegeChange">
						<view class="picker-content">
							<text class="picker-text">{{ collegeOptions[collegeIndex] }}</text>
							<text class="picker-arrow">></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="label">专业</text>
					<picker class="picker-field" :value="majorIndex" :range="majorOptions" @change="onMajorChange">
						<view class="picker-content">
							<text class="picker-text">{{ majorOptions[majorIndex] }}</text>
							<text class="picker-arrow">></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="label">年级</text>
					<picker class="picker-field" :value="gradeIndex" :range="gradeOptions" @change="onGradeChange">
						<view class="picker-content">
							<text class="picker-text">{{ gradeOptions[gradeIndex] }}</text>
							<text class="picker-arrow">></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="label">学号</text>
					<input class="input-field" v-model="userInfo.studentId" placeholder="请输入学号" />
				</view>
			</view>
		</view>

		<!-- 个人简介 -->
		<view class="bio-section">
			<text class="section-title">个人简介</text>
			<view class="bio-form">
				<textarea 
					class="bio-textarea"
					v-model="userInfo.bio"
					placeholder="介绍一下自己吧..."
					:maxlength="500"
					show-confirm-bar="false">
				</textarea>
				<view class="char-count">
					<text class="count-text">{{ (userInfo.bio || '').length }}/500</text>
				</view>
			</view>
		</view>

		<!-- 兴趣标签 -->
		<view class="interests-section">
			<text class="section-title">兴趣标签</text>
			<view class="interests-form">
				<view class="tag-list">
					<view class="interest-tag" 
						v-for="(tag, index) in allTags" 
						:key="index"
						:class="{ 'selected': selectedTags.includes(tag) }"
						@click="toggleTag(tag)">
						<text class="tag-text">{{ tag }}</text>
					</view>
				</view>
				<text class="tag-tip">最多选择5个标签</text>
			</view>
		</view>

		<!-- 保存按钮 -->
		<view class="save-section">
			<view class="save-btn" :class="{ 'disabled': !canSave }" @click="saveProfile">
				<text class="save-text">保存</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userInfo: {
				nickname: '张同学',
				avatar: '',
				birthday: '2000-01-01',
				phone: '',
				email: '',
				studentId: '',
				bio: ''
			},
			genderIndex: 0,
			genderOptions: ['保密', '男', '女'],
			collegeIndex: 0,
			collegeOptions: ['计算机学院', '软件学院', '信息学院', '电子学院', '机械学院'],
			majorIndex: 1,
			majorOptions: ['计算机科学与技术', '软件工程', '网络工程', '数据科学与大数据技术', '人工智能'],
			gradeIndex: 2,
			gradeOptions: ['大一', '大二', '大三', '大四', '研一', '研二', '研三'],
			allTags: [
				'前端开发', '后端开发', '移动开发', '人工智能', '数据分析',
				'算法竞赛', '设计', 'UI/UX', '产品经理', '项目管理',
				'机器学习', '深度学习', '区块链', '云计算', '大数据',
				'游戏开发', '网络安全', '数据库', '运维', '测试'
			],
			selectedTags: ['前端开发', '算法竞赛'],
			originalData: {}
		}
	},
	
	computed: {
		canSave() {
			return this.userInfo.nickname.trim().length > 0
		}
	},
	
	onLoad() {
		this.loadUserProfile()
		this.originalData = JSON.parse(JSON.stringify(this.userInfo))
	},
	
	onUnload() {
		this.checkUnsavedChanges()
	},
	
	methods: {
		async loadUserProfile() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.redirectTo({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: 'this.$config.apiBaseUrl + '/users/profile',
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					const user = response.data.data.user
					this.userInfo = {
						nickname: user.nickname || '',
						avatar: user.avatar_url || '',
						name: user.name || '',
						phone: user.phone_number || '',
						email: user.email || '',
						studentId: user.student_id || '',
						bio: user.bio || ''
					}
					this.originalData = JSON.parse(JSON.stringify(this.userInfo))
				}
			} catch (error) {
				console.error('加载用户资料失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0]
					
					// 检查文件大小
					uni.getFileInfo({
						filePath: tempFilePath,
						success: (fileInfo) => {
							if (fileInfo.size > 5 * 1024 * 1024) {
								uni.showToast({
									title: '图片大小不能超过5MB',
									icon: 'none'
								})
								return
							}
							
							this.uploadAvatar(tempFilePath)
						}
					})
				}
			})
		},
		
		async uploadAvatar(filePath) {
			try {
				const token = uni.getStorageSync('token')
				uni.showLoading({
					title: '上传中...'
				})
				
				const response = await uni.uploadFile({
					url: 'this.$config.apiBaseUrl + '/users/avatar',
					filePath: filePath,
					name: 'avatar',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				const result = JSON.parse(response.data)
				if (result.success) {
					this.userInfo.avatar = result.data.avatar_url
					uni.showToast({
						title: '头像上传成功',
						icon: 'success'
					})
				} else {
					throw new Error(result.message)
				}
			} catch (error) {
				console.error('头像上传失败:', error)
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		removeAvatar() {
			uni.showModal({
				title: '确认操作',
				content: '确定要移除当前头像吗？',
				success: (res) => {
					if (res.confirm) {
						this.userInfo.avatar = ''
						uni.showToast({
							title: '头像已移除',
							icon: 'success'
						})
					}
				}
			})
		},
		
		onGenderChange(e) {
			this.genderIndex = e.detail.value
		},
		
		onBirthdayChange(e) {
			this.userInfo.birthday = e.detail.value
		},
		
		onCollegeChange(e) {
			this.collegeIndex = e.detail.value
			// 重置专业选择
			this.majorIndex = 0
		},
		
		onMajorChange(e) {
			this.majorIndex = e.detail.value
		},
		
		onGradeChange(e) {
			this.gradeIndex = e.detail.value
		},
		
		toggleTag(tag) {
			const index = this.selectedTags.indexOf(tag)
			if (index > -1) {
				this.selectedTags.splice(index, 1)
			} else {
				if (this.selectedTags.length >= 5) {
					uni.showToast({
						title: '最多选择5个标签',
						icon: 'none'
					})
					return
				}
				this.selectedTags.push(tag)
			}
		},
		
		async saveProfile() {
			if (!this.canSave) {
				uni.showToast({
					title: '请填写必要信息',
					icon: 'none'
				})
				return
			}
			
			uni.showLoading({
				title: '保存中...'
			})
			
			try {
				const token = uni.getStorageSync('token')
				
				// 构建保存数据
				const profileData = {}
				
				// 只发送有值的字段
				if (this.userInfo.name && this.userInfo.name.trim()) {
					profileData.name = this.userInfo.name.trim()
				}
				if (this.userInfo.nickname && this.userInfo.nickname.trim()) {
					profileData.nickname = this.userInfo.nickname.trim()
				}
				if (this.userInfo.email && this.userInfo.email.trim()) {
					profileData.email = this.userInfo.email.trim()
				}
				if (this.userInfo.studentId && this.userInfo.studentId.trim()) {
					profileData.student_id = this.userInfo.studentId.trim()
				}
				if (this.userInfo.bio !== undefined && this.userInfo.bio !== null) {
					profileData.bio = this.userInfo.bio.trim()
				}
				
				const response = await uni.request({
					url: 'this.$config.apiBaseUrl + '/users/profile',
					method: 'PUT',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: profileData
				})
				
				if (response.data.success) {
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})
					
					// 更新原始数据
					this.originalData = JSON.parse(JSON.stringify(this.userInfo))
					
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					throw new Error(response.data.message || '保存失败')
				}
			} catch (error) {
				console.error('保存失败:', error)
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		checkUnsavedChanges() {
			const hasChanges = JSON.stringify(this.userInfo) !== JSON.stringify(this.originalData) ||
							  this.selectedTags.join(',') !== ['前端开发', '算法竞赛'].join(',')
			
			if (hasChanges) {
				uni.showModal({
					title: '提示',
					content: '您有未保存的修改，确定要离开吗？',
					success: (res) => {
						if (!res.confirm) {
							// 阻止返回
							return false
						}
					}
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.edit-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin: 40rpx 30rpx 20rpx;
}

.avatar-section {
	margin: 20rpx;
	
	.avatar-edit {
		background: white;
		border-radius: 15rpx;
		padding: 40rpx;
		text-align: center;
		
		.current-avatar {
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			border: 4rpx solid #f0f0f0;
			margin-bottom: 30rpx;
		}
		
		.avatar-actions {
			display: flex;
			justify-content: center;
			gap: 20rpx;
			
			.action-btn {
				padding: 15rpx 30rpx;
				border-radius: 25rpx;
				border: 2rpx solid #007aff;
				
				.btn-text {
					font-size: 26rpx;
					color: #007aff;
				}
				
				&.secondary {
					border-color: #ff3b30;
					
					.btn-text {
						color: #ff3b30;
					}
				}
			}
		}
	}
}

.info-section, .academic-section {
	margin: 20rpx;
	
	.form-group {
		background: white;
		border-radius: 15rpx;
		overflow: hidden;
		
		.form-item {
			display: flex;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.label {
				width: 120rpx;
				font-size: 30rpx;
				color: #333;
				margin-right: 30rpx;
			}
			
			.input-field {
				flex: 1;
				font-size: 30rpx;
				color: #333;
			}
			
			.picker-field {
				flex: 1;
				
				.picker-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					
					.picker-text {
						font-size: 30rpx;
						color: #333;
					}
					
					.picker-arrow {
						font-size: 24rpx;
						color: #ccc;
					}
				}
			}
		}
	}
}

.bio-section {
	margin: 20rpx;
	
	.bio-form {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.bio-textarea {
			width: 100%;
			min-height: 150rpx;
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
		}
		
		.char-count {
			text-align: right;
			margin-top: 15rpx;
			
			.count-text {
				font-size: 24rpx;
				color: #999;
			}
		}
	}
}

.interests-section {
	margin: 20rpx;
	
	.interests-form {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.tag-list {
			display: flex;
			flex-wrap: wrap;
			gap: 15rpx;
			margin-bottom: 20rpx;
			
			.interest-tag {
				padding: 12rpx 24rpx;
				border-radius: 25rpx;
				border: 2rpx solid #e0e0e0;
				background: #f8f8f8;
				
				&.selected {
					border-color: #007aff;
					background: #e6f3ff;
					
					.tag-text {
						color: #007aff;
					}
				}
				
				.tag-text {
					font-size: 26rpx;
					color: #666;
				}
			}
		}
		
		.tag-tip {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.save-section {
	margin: 40rpx 20rpx 20rpx;
	
	.save-btn {
		background: #007aff;
		border-radius: 30rpx;
		padding: 30rpx;
		text-align: center;
		
		&.disabled {
			background: #ccc;
		}
		
		.save-text {
			font-size: 32rpx;
			color: white;
			font-weight: bold;
		}
	}
}
</style>