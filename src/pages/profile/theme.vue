<template>
	<view class="theme-container">
		<!-- 当前主题预览 -->
		<view class="current-theme">
			<text class="section-title">当前主题</text>
			<view class="theme-preview" :class="'theme-' + currentTheme">
				<view class="preview-header">
					<text class="preview-title">日新智链</text>
					<text class="preview-subtitle">{{ getThemeName(currentTheme) }}</text>
				</view>
				<view class="preview-content">
					<view class="preview-card">
						<text class="card-title">示例卡片</text>
						<text class="card-text">这是主题色彩预览</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 主题选择 -->
		<view class="theme-selection">
			<text class="section-title">选择主题</text>
			<view class="theme-grid">
				<view class="theme-item" 
					v-for="(theme, index) in themes" 
					:key="index"
					:class="{ 'active': currentTheme === theme.key }"
					@click="selectTheme(theme.key)">
					<view class="theme-sample" :class="'theme-' + theme.key">
						<view class="sample-header"></view>
						<view class="sample-body">
							<view class="sample-line"></view>
							<view class="sample-line short"></view>
						</view>
					</view>
					<text class="theme-name">{{ theme.name }}</text>
					<view class="theme-check" v-if="currentTheme === theme.key">✓</view>
				</view>
			</view>
		</view>

		<!-- 个性化设置 -->
		<view class="customization">
			<text class="section-title">个性化设置</text>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">跟随系统</text>
					<text class="setting-desc">自动切换深色/浅色模式</text>
				</view>
				<switch class="setting-switch" :checked="settings.followSystem" @change="onFollowSystemChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">护眼模式</text>
					<text class="setting-desc">降低蓝光，保护视力</text>
				</view>
				<switch class="setting-switch" :checked="settings.eyeProtection" @change="onEyeProtectionChange" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">字体大小</text>
					<text class="setting-desc">调整界面字体大小</text>
				</view>
				<picker class="setting-picker" :value="fontSizeIndex" :range="fontSizeOptions" @change="onFontSizeChange">
					<view class="picker-content">
						<text class="picker-text">{{ fontSizeOptions[fontSizeIndex] }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-name">动画效果</text>
					<text class="setting-desc">界面切换动画</text>
				</view>
				<switch class="setting-switch" :checked="settings.animations" @change="onAnimationsChange" />
			</view>
		</view>

		<!-- 自定义颜色 -->
		<view class="color-customization">
			<text class="section-title">自定义颜色</text>
			<view class="color-picker-section">
				<text class="color-label">主题色</text>
				<view class="color-palette">
					<view class="color-item" 
						v-for="(color, index) in customColors" 
						:key="index"
						:style="{ backgroundColor: color }"
						:class="{ 'active': currentCustomColor === color }"
						@click="selectCustomColor(color)">
					</view>
				</view>
			</view>
		</view>

		<!-- 重置选项 -->
		<view class="reset-section">
			<view class="reset-btn" @click="resetToDefault">
				<text class="reset-text">恢复默认设置</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTheme: 'light',
			currentCustomColor: '#007aff',
			fontSizeIndex: 1,
			fontSizeOptions: ['小', '标准', '大', '超大'],
			settings: {
				followSystem: false,
				eyeProtection: false,
				animations: true
			},
			themes: [
				{ key: 'light', name: '浅色模式' },
				{ key: 'dark', name: '深色模式' },
				{ key: 'blue', name: '蓝色主题' },
				{ key: 'green', name: '绿色主题' },
				{ key: 'purple', name: '紫色主题' },
				{ key: 'orange', name: '橙色主题' }
			],
			customColors: [
				'#007aff', '#5ac725', '#ff3b30', '#ff9500',
				'#af52de', '#ff2d92', '#5856d6', '#34c759',
				'#007aff', '#ff9f0a', '#bf5af2', '#ff375f'
			]
		}
	},
	
	onLoad() {
		this.loadThemeSettings()
	},
	
	methods: {
		async loadThemeSettings() {
			try {
				// 模拟加载用户主题设置
				const savedTheme = uni.getStorageSync('theme') || 'light'
				this.currentTheme = savedTheme
				
				const savedSettings = uni.getStorageSync('themeSettings') || {}
				this.settings = { ...this.settings, ...savedSettings }
			} catch (error) {
				console.error('加载主题设置失败:', error)
			}
		},
		
		selectTheme(themeKey) {
			this.currentTheme = themeKey
			this.saveThemeSettings()
			this.applyTheme()
		},
		
		selectCustomColor(color) {
			this.currentCustomColor = color
			this.saveThemeSettings()
			this.applyCustomColor()
		},
		
		onFollowSystemChange(e) {
			this.settings.followSystem = e.detail.value
			this.saveThemeSettings()
			
			if (this.settings.followSystem) {
				this.autoSwitchTheme()
			}
		},
		
		onEyeProtectionChange(e) {
			this.settings.eyeProtection = e.detail.value
			this.saveThemeSettings()
			this.applyEyeProtection()
		},
		
		onFontSizeChange(e) {
			this.fontSizeIndex = e.detail.value
			this.saveThemeSettings()
			this.applyFontSize()
		},
		
		onAnimationsChange(e) {
			this.settings.animations = e.detail.value
			this.saveThemeSettings()
			this.applyAnimationSettings()
		},
		
		saveThemeSettings() {
			try {
				uni.setStorageSync('theme', this.currentTheme)
				uni.setStorageSync('themeSettings', this.settings)
				uni.setStorageSync('customColor', this.currentCustomColor)
				uni.setStorageSync('fontSize', this.fontSizeIndex)
				
				uni.showToast({
					title: '设置已保存',
					icon: 'success'
				})
			} catch (error) {
				console.error('保存主题设置失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		},
		
		applyTheme() {
			// 实际应用主题的逻辑
			console.log('应用主题:', this.currentTheme)
		},
		
		applyCustomColor() {
			// 应用自定义颜色的逻辑
			console.log('应用自定义颜色:', this.currentCustomColor)
		},
		
		applyEyeProtection() {
			// 应用护眼模式的逻辑
			console.log('护眼模式:', this.settings.eyeProtection)
		},
		
		applyFontSize() {
			// 应用字体大小的逻辑
			console.log('字体大小:', this.fontSizeOptions[this.fontSizeIndex])
		},
		
		applyAnimationSettings() {
			// 应用动画设置的逻辑
			console.log('动画效果:', this.settings.animations)
		},
		
		autoSwitchTheme() {
			// 根据系统设置自动切换主题
			const systemDarkMode = uni.getSystemInfoSync().theme === 'dark'
			this.currentTheme = systemDarkMode ? 'dark' : 'light'
			this.applyTheme()
		},
		
		resetToDefault() {
			uni.showModal({
				title: '恢复默认设置',
				content: '确定要恢复所有主题设置到默认状态吗？',
				success: (res) => {
					if (res.confirm) {
						this.currentTheme = 'light'
						this.currentCustomColor = '#007aff'
						this.fontSizeIndex = 1
						this.settings = {
							followSystem: false,
							eyeProtection: false,
							animations: true
						}
						
						this.saveThemeSettings()
						this.applyTheme()
						
						uni.showToast({
							title: '已恢复默认设置',
							icon: 'success'
						})
					}
				}
			})
		},
		
		getThemeName(themeKey) {
			const theme = this.themes.find(t => t.key === themeKey)
			return theme ? theme.name : '未知主题'
		}
	}
}
</script>

<style lang="scss" scoped>
.theme-container {
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

.current-theme {
	margin: 20rpx;
	
	.theme-preview {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		
		&.theme-dark {
			background: #1c1c1e;
			color: white;
		}
		
		&.theme-blue {
			background: linear-gradient(135deg, #007aff 0%, #5ac725 100%);
			color: white;
		}
		
		.preview-header {
			margin-bottom: 30rpx;
			
			.preview-title {
				display: block;
				font-size: 36rpx;
				font-weight: bold;
				margin-bottom: 10rpx;
			}
			
			.preview-subtitle {
				font-size: 26rpx;
				opacity: 0.8;
			}
		}
		
		.preview-content {
			.preview-card {
				background: rgba(0, 0, 0, 0.05);
				padding: 30rpx;
				border-radius: 15rpx;
				
				.card-title {
					display: block;
					font-size: 28rpx;
					font-weight: bold;
					margin-bottom: 10rpx;
				}
				
				.card-text {
					font-size: 24rpx;
					opacity: 0.8;
				}
			}
		}
	}
}

.theme-selection {
	margin: 20rpx;
	
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
		
		.theme-item {
			background: white;
			border-radius: 20rpx;
			padding: 30rpx;
			text-align: center;
			position: relative;
			border: 3rpx solid transparent;
			
			&.active {
				border-color: #007aff;
			}
			
			.theme-sample {
				width: 120rpx;
				height: 80rpx;
				border-radius: 12rpx;
				margin: 0 auto 20rpx;
				overflow: hidden;
				
				&.theme-light {
					background: #ffffff;
					border: 2rpx solid #f0f0f0;
				}
				
				&.theme-dark {
					background: #1c1c1e;
				}
				
				&.theme-blue {
					background: linear-gradient(135deg, #007aff 0%, #5ac725 100%);
				}
				
				&.theme-green {
					background: linear-gradient(135deg, #5ac725 0%, #34c759 100%);
				}
				
				&.theme-purple {
					background: linear-gradient(135deg, #af52de 0%, #5856d6 100%);
				}
				
				&.theme-orange {
					background: linear-gradient(135deg, #ff9500 0%, #ff2d92 100%);
				}
				
				.sample-header {
					height: 20rpx;
					background: rgba(255, 255, 255, 0.3);
					margin: 8rpx;
					border-radius: 4rpx;
				}
				
				.sample-body {
					padding: 0 8rpx;
					
					.sample-line {
						height: 6rpx;
						background: rgba(255, 255, 255, 0.5);
						margin-bottom: 6rpx;
						border-radius: 3rpx;
						
						&.short {
							width: 60%;
						}
					}
				}
			}
			
			.theme-name {
				font-size: 26rpx;
				color: #333;
			}
			
			.theme-check {
				position: absolute;
				top: 20rpx;
				right: 20rpx;
				width: 40rpx;
				height: 40rpx;
				background: #007aff;
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24rpx;
			}
		}
	}
}

.customization {
	margin: 20rpx;
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
	
	.setting-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.setting-info {
			flex: 1;
			
			.setting-name {
				display: block;
				font-size: 30rpx;
				color: #333;
				margin-bottom: 8rpx;
			}
			
			.setting-desc {
				font-size: 24rpx;
				color: #666;
			}
		}
		
		.setting-switch {
			transform: scale(0.8);
		}
		
		.setting-picker {
			.picker-content {
				display: flex;
				align-items: center;
				
				.picker-text {
					font-size: 28rpx;
					color: #007aff;
					margin-right: 10rpx;
				}
				
				.picker-arrow {
					font-size: 24rpx;
					color: #ccc;
				}
			}
		}
	}
}

.color-customization {
	margin: 20rpx;
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	
	.color-picker-section {
		margin-top: 20rpx;
		
		.color-label {
			display: block;
			font-size: 28rpx;
			color: #333;
			margin-bottom: 20rpx;
		}
		
		.color-palette {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 15rpx;
			
			.color-item {
				width: 60rpx;
				height: 60rpx;
				border-radius: 50%;
				border: 4rpx solid transparent;
				
				&.active {
					border-color: #333;
				}
			}
		}
	}
}

.reset-section {
	margin: 40rpx 20rpx 20rpx;
	
	.reset-btn {
		background: white;
		border: 2rpx solid #ff3b30;
		border-radius: 30rpx;
		padding: 24rpx 40rpx;
		text-align: center;
		
		.reset-text {
			font-size: 30rpx;
			color: #ff3b30;
		}
	}
}
</style>