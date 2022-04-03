import { createRouter, createWebHistory } from "vue-router";

const routes = [
    { path: "/", component: () => import("./pages/HomePage.vue") },
    { path: "/my-profile/", component: () => import("./pages/MyProfile.vue") },
    { path: "/profiles/:agent", component: () => import("./pages/AgentProfile.vue") },
    { path: "/feed", component: () => import("./pages/MewsFeed.vue") },
    { path: "/feed/cashtag/:tag", component: () => import("./pages/MewsWithHashtag.vue") },
    { path: "/feed/hashtag/:tag", component: () => import("./pages/MewsWithHashtag.vue") },
    { path: '/:pathMatch(.*)', component: () => import("./pages/NotFound.vue") }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;