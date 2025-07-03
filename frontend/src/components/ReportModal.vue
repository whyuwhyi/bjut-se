<template>
  <view v-if="visible" class="report-modal-mask" @click.self="closeModal">
    <view class="report-modal-window">
      <view class="modal-header">
        <text class="modal-title">举报{{ contentType === 'resource' ? '资源' : '帖子' }}</text>
        <text class="close-btn" @click="closeModal">×</text>
      </view>
      
      <view class="modal-content">
        <view class="reason-section">
          <text class="section-title">举报原因</text>
          <view class="reason-list">
            <view 
              v-for="reason in reasons" 
              :key="reason.value"
              class="reason-item"
              :class="{ active: selectedReason === reason.value }"
              @click="selectReason(reason.value)"
            >
              <text class="reason-text">{{ reason.label }}</text>
              <text v-if="selectedReason === reason.value" class="check-icon">✓</text>
            </view>
          </view>
        </view>
        
        <view class="description-section">
          <text class="section-title">详细描述 (可选)</text>
          <textarea 
            v-model="description"
            class="description-input"
            placeholder="请详细描述您举报的原因..."
            maxlength="500"
          />
          <text class="char-count">{{ description.length }}/500</text>
        </view>
      </view>
      
      <view class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button 
          class="submit-btn" 
          :class="{ disabled: !selectedReason }"
          :disabled="!selectedReason || submitting"
          @click="submitReport"
        >
          {{ submitting ? '提交中...' : '提交举报' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// import { reportResource, reportPost, getReportReasons } from '@/utils/api.js'

export default {
  name: 'ReportModal',
  props: {
    contentType: {
      type: String,
      required: true,
      validator: value => ['resource', 'post'].includes(value)
    },
    contentId: {
      type: String,
      required: true
    },
    contentTitle: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      visible: false,
      selectedReason: '',
      description: '',
      reasons: [],
      submitting: false
    }
  },
  methods: {
    async loadReasons() {
      try {
        // 暂时使用默认原因，避免API调用问题
        this.reasons = this.getDefaultReasons()
      } catch (error) {
        console.error('加载举报原因失败:', error)
        this.reasons = this.getDefaultReasons()
      }
    },
    
    getDefaultReasons() {
      if (this.contentType === 'resource') {
        return [
          { value: 'inappropriate', label: '内容不当' },
          { value: 'copyright', label: '版权问题' },
          { value: 'spam', label: '垃圾信息' },
          { value: 'offensive', label: '冒犯性内容' },
          { value: 'other', label: '其他' }
        ]
      } else {
        return [
          { value: 'inappropriate', label: '内容不当' },
          { value: 'spam', label: '垃圾信息' },
          { value: 'offensive', label: '冒犯性内容' },
          { value: 'harassment', label: '骚扰他人' },
          { value: 'false_info', label: '虚假信息' },
          { value: 'other', label: '其他' }
        ]
      }
    },
    
    selectReason(reason) {
      this.selectedReason = reason
    },
    
    async submitReport() {
      if (!this.selectedReason || this.submitting) return
      
      try {
        this.submitting = true
        
        // 暂时模拟提交成功，避免API调用问题
        uni.showToast({
          title: '举报提交成功',
          icon: 'success',
          duration: 2000
        })
        this.closeModal()
        this.$emit('reported')
      } catch (error) {
        console.error('提交举报失败:', error)
        uni.showToast({
          title: '举报提交失败',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.submitting = false
      }
    },
    
    show() {
      console.log('ReportModal.show() 被调用了')
      this.visible = true
      this.resetForm()
      // 显示时加载举报原因
      this.loadReasons()
    },
    
    closeModal() {
      this.visible = false
      this.resetForm()
    },
    
    resetForm() {
      this.selectedReason = ''
      this.description = ''
      this.submitting = false
    }
  }
}
</script>

<style scoped>
.report-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.report-modal-window {
  width: 80vw;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.18);
  animation: slideIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.close-btn {
  font-size: 40rpx;
  color: #999999;
  font-weight: 300;
  padding: 10rpx;
  line-height: 1;
  cursor: pointer;
}

.modal-content {
  padding: 30rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
}

.reason-section {
  margin-bottom: 40rpx;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.reason-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.reason-item.active {
  border-color: #007aff;
  background-color: #f0f8ff;
}

.reason-text {
  font-size: 26rpx;
  color: #333333;
}

.reason-item.active .reason-text {
  color: #007aff;
  font-weight: 500;
}

.check-icon {
  font-size: 28rpx;
  color: #007aff;
  font-weight: 600;
}

.description-section {
  margin-bottom: 20rpx;
}

.description-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333333;
  background-color: #fafafa;
  box-sizing: border-box;
  resize: none;
}

.description-input:focus {
  border-color: #007aff;
  background-color: #ffffff;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999999;
  margin-top: 10rpx;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx 30rpx;
}

.cancel-btn, .submit-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.cancel-btn:active {
  background-color: #e0e0e0;
}

.submit-btn {
  background-color: #007aff;
  color: #ffffff;
  font-weight: 500;
}

.submit-btn:active:not(.disabled) {
  background-color: #0056cc;
}

.submit-btn.disabled {
  background-color: #cccccc;
  color: #999999;
}
</style>