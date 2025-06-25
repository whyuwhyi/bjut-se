import Vue from 'vue'
import App from './App.vue'
import './uni.promisify.adaptor'
import config from './utils/config.js'

Vue.config.productionTip = false

// 将配置挂载到Vue原型上
Vue.prototype.$config = config

const app = new (typeof App === 'function' ? App : Vue.extend(Object.assign({ mpType: 'app' }, App)))
app.$mount();
