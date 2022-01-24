import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', component: () => import('./pages/Home.vue') },
    { path: '/profile', component: () => import('./pages/Profile.vue') }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router