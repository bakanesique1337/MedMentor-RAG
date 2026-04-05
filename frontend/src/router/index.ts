import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/constants/routes'
import { authGuard } from '@/router/guards/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/PublicLayout.vue'),
      children: [
        {
          path: '',
          name: ROUTES.HOME,
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'login',
          name: ROUTES.LOGIN,
          component: () => import('@/views/LoginView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
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
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: ROUTES.NOT_FOUND,
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
