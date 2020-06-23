import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

import customBrush from '../views/brush/customBrush'
import officalCord from '../views/chord/officialExample'
Vue.use(VueRouter)

  const routes = [
  {
      path: '/example',
      name: 'example',
      component:{ render:c=>c("router-view")},
      children:[
          {
              path: '/cutstomBrush',
              name: 'brush',
              component: customBrush
          },
          {
              path: '/chord1',
              name: 'chord1',
              component: officalCord
          }
      ]
  },
  {
      path: '/',
      name: 'Home',
      component: Home
  },
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
