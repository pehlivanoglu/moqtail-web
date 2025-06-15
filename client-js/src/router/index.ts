import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import JoinPage from '../pages/JoinPage.vue'
import SessionPage from '../pages/SessionPage.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/join', component: JoinPage },
  { path: '/session', component: SessionPage },
  { path: '/:catchAll(.*)', redirect: '/join' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
