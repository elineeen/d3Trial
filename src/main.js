import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import * as d3 from 'd3';
import _ from 'lodash'
Vue.prototype._ = _;
Vue.config.productionTip = false
Vue.prototype.$d3=d3;
new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
