<template>
  <view v-if="visible" class="modal-mask" @click.self="closeModal">
    <view class="modal-window">
      <view class="modal-header">
        <text class="modal-title">举报内容</text>
        <text class="close-btn" @click="closeModal">×</text>
      </view>
      
      <view class="modal-content">
        <view class="reason-list">
          <view 
            v-for="reason in reasons" 
            :key="reason"
            class="reason-item"
            :class="{ active: selectedReason === reason }"
            @click="selectReason(reason)"
          >
            <text class="reason-text">{{ reason }}</text>
            <text v-if="selectedReason === reason" class="check-icon">✓</text>
          </view>
        </view>
      </view>
      
      <view class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button 
          class="submit-btn" 
          :disabled="!selectedReason"
          @click="submitReport"
        >
          提交举报
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SimpleReportModal',
  data() {
    return {
      visible: false,
      selectedReason: '',
      reasons: ['内容不当', '垃圾信息', '冒犯性内容', '其他']
    }
  },
  methods: {
    show() {
      console.log('SimpleReportModal.show() 被调用了')
      this.visible = true
      this.selectedReason = ''
    },
    
    closeModal() {
      this.visible = false
      this.selectedReason = ''
    },
    
    selectReason(reason) {
      this.selectedReason = reason
    },
    
    submitReport() {
      if (!this.selectedReason) return
      
      uni.showToast({
        title: `已举报：${this.selectedReason}`,
        icon: 'success'
      })
      this.closeModal()
    }
  }
}
</script>

<style scoped>
.modal-mask {
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
}

.modal-window {
  width: 80vw;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
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
  padding: 10rpx;
}

.modal-content {
  padding: 30rpx;
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
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.submit-btn {
  background-color: #007aff;
  color: #ffffff;
}

.submit-btn:disabled {
  background-color: #cccccc;
  color: #999999;
}
</style>