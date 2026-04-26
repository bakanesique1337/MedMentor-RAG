import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/constants/routes'
import { authGuard } from '@/router/guards/auth'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'public' | 'app' | 'error'
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/PublicLayout.vue'),
      meta: { layout: 'public' },
      children: [
        {
          path: '',
          name: ROUTES.HOME,
          component: () => import('@/views/HomeView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { layout: 'app' },
      beforeEnter: authGuard,
      children: [
        {
          path: 'cases',
          name: ROUTES.CASES,
          component: () => import('@/views/CasesView.vue'),
        },
        {
          path: 'profile',
          name: ROUTES.PROFILE,
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'chat/:sessionId',
          name: ROUTES.CHAT,
          component: () => import('@/views/ChatView.vue'),
        },
        {
          path: 'sessions/:sessionId/result',
          name: ROUTES.RESULT,
          component: () => import('@/views/CaseResultView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/components/layout/ErrorLayout.vue'),
      meta: { layout: 'error' },
      children: [
        {
          path: '',
          name: ROUTES.NOT_FOUND,
          component: () => import('@/views/NotFoundView.vue'),
        },
      ],
    },
  ],
})

export default router
