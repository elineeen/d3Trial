import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

import customBrush from '../views/brush/customBrush'
import officialChord from '../views/chord/officialExample';
import dependencyChord from '../views/chord/chordDependency'
import hierarchyCircleLayout from '../views/layouts/hierarchyCircleLayout'
import forceLayout from '../views/layouts/forceLayout'
import barChart from '../views/commonCharts/barChart'
import geoVoronoi from '../views/geo/voronoi'
import collisionDetection from '../views/force/collision-detection'
import USAWindMap from '../views/geo/wind'
import USAWindMapCanvas from '../views/geo/windCanvas'
import compositeSakura from '../views/chord/sakura'
import gitIndex from "../views/geo/gitIndex";
import circularEffects from "../views/commonCharts/circularEffects";
Vue.use(VueRouter)

  const routes = [
  {
      path: '/example',
      name: 'example',
      component:{ render:c=>c("router-view")},
      children:[
          {
              path: '/customBrush',
              name: 'brush',
              component: customBrush
          },
          {
              path: '/chord1',
              name: 'chord1',
              component: officialChord
          },
          {
              path: '/chord2',
              name: 'chordDependency',
              component: dependencyChord
          },
          {
              path: '/layout1',
              name: 'hierarchyCircleLayout',
              component: hierarchyCircleLayout
          },
          {
              path: '/layout2',
              name: 'forceLayout',
              component: forceLayout
          },
          {
              path: '/barChart',
              name: 'barChart',
              component: barChart
          },
          {
              path: '/geoVoronoi',
              name: 'geoVoronoi',
              component: geoVoronoi
          },
          {
              path: '/collision',
              name: 'collision',
              component: collisionDetection
          },
          {
              path: '/windSVG',
              name: 'USAWindMap',
              component: USAWindMap
          },
          {
              path: '/windCanvas',
              name: 'USAWindMapCanvas',
              component: USAWindMapCanvas
          },
          {
              path: '/compositeSakura',
              name: 'compositeSakura',
              component: compositeSakura
          },
          {
              path: '/gitIndex',
              name: 'gitIndex',
              component: gitIndex
          },
          {
              path: '/swooshDemo',
              name: 'swooshDemo',
              component: circularEffects
          },

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
