import Vue from 'vue'
import App from './App.vue'
import './uni.promisify.adaptor'
import config from './utils/config.js'

Vue.config.productionTip = false

// 将配置挂载到Vue原型上
Vue.prototype.$config = config

// 注册uni-ui组件
import uniPopup from '@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue'
Vue.component('uni-popup', uniPopup)

const app = new (typeof App === 'function' ? App : Vue.extend(Object.assign({ mpType: 'app' }, App)))
app.$mount();
