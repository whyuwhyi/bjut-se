<script lang="ts">
    import Vue from 'vue';
    export default Vue.extend({
        mpType: 'app',
        onLaunch() {
            console.log('App Launch')
            // 临时注释掉登录检查，直接进入首页
            //setTimeout(() => {
              //  uni.reLaunch({
                //    url: '/pages/index/index'
                //})
            //}, 1000)
        },
        onShow() {
            console.log('App Show')
        },
        onHide() {
            console.log('App Hide')
        }
    } as any);
</script>

<style>
    /*每个页面公共css */
    
    /* 导入图标字体 */
    @import url('https://at.alicdn.com/t/c/font_4701891_qcugs7g3r5.css');
    
    /* 全局背景样式 */
    page {
        min-height: 100vh;
        background-color: #FAEED1 !important;
        background-image: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%) !important;
        background-size: 400% 400%;
        animation: backgroundPan 15s ease infinite;
    }
    
    @keyframes backgroundPan {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    /* 全局容器样式 */
    .container {
        min-height: 100vh;
        padding: 30rpx;
        background: transparent !important;
    }
    
    /* tabBar样式调整 */
    .uni-tabbar {
        height: 60px !important;
        border-top: 1px solid #e0e0e0 !important;
    }
    
    .uni-tabbar .uni-tabbar-item {
        height: 60px !important;
        padding: 6px 0 !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    /* 隐藏原有文字，用图标替代 */
    .uni-tabbar .uni-tabbar-item .uni-tabbar-item-label {
        font-size: 10px !important;
        margin-top: 2px !important;
        position: relative !important;
    }
    
    /* 使用伪元素创建图标 */
    .uni-tabbar .uni-tabbar-item::before {
        content: "";
        font-family: 'iconfont' !important;
        font-size: 28px !important;
        font-style: normal !important;
        color: #7A7E83 !important;
        margin-bottom: 2px !important;
        display: block !important;
    }
    
    /* 选中状态图标颜色 */
    .uni-tabbar .uni-tabbar-item.uni-tabbar-item--selected::before {
        color: #007aff !important;
    }
    
    /* 首页图标 */
    .uni-tabbar .uni-tabbar-item:nth-child(1)::before {
        content: "🏠";
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 32px !important;
    }
    
    /* 资源图标 */
    .uni-tabbar .uni-tabbar-item:nth-child(2)::before {
        content: "📚";
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 32px !important;
    }
    
    /* 讨论图标 */
    .uni-tabbar .uni-tabbar-item:nth-child(3)::before {
        content: "💬";
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 32px !important;
    }
    
    /* 活动图标 */
    .uni-tabbar .uni-tabbar-item:nth-child(4)::before {
        content: "🎯";
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 32px !important;
    }
    
    /* 我的图标 */
    .uni-tabbar .uni-tabbar-item:nth-child(5)::before {
        content: "👤";
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
        font-size: 32px !important;
    }
    
    /* H5平台特殊样式 */
    #app .uni-app-container .uni-app-body .uni-tabbar {
        border-top: 1px solid #e0e0e0 !important;
        height: 60px !important;
    }
    
    #app .uni-app-container .uni-app-body .uni-tabbar .uni-tabbar-item {
        height: 60px !important;
        padding: 6px 0 !important;
    }
    
    #app .uni-app-container .uni-app-body .uni-tabbar .uni-tabbar-item::before {
        font-size: 36px !important;
    }
</style>
