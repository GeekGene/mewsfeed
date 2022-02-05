import { createRouter, createWebHistory } from "vue-router";

const routes = [
    { path: "/", component: () => import("./pages/HomePage.vue") },
    { path: "/my-profile/", component: () => import("./pages/MyProfile.vue") },
    { path: "/profile/:agent-pub-key", component: () => import("./pages/AgentProfile.vue") },
    { path: "/feed", component: () => import("./pages/MewsFeed.vue") },
    { path: '/:pathMatch(.*)', component: () => import("./pages/NotFound.vue") }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;