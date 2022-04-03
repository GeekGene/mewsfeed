import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { CASHTAG, HASHTAG } from "./types/types";

const SEGMENT_CASHTAG = 'cashtag';
const SEGMENT_HASHTAG = 'hashtag';

const routes: RouteRecordRaw[] = [
    { path: "/", component: () => import("./pages/HomePage.vue") },
    { path: "/my-profile/", component: () => import("./pages/MyProfile.vue") },
    { path: "/profiles/:agent", component: () => import("./pages/AgentProfile.vue") },
    { path: "/feed", component: () => import("./pages/MewsFeed.vue") },
    { path: `/feed/${SEGMENT_CASHTAG}/:tag`, component: () => import("./pages/MewsWithHashtag.vue"), meta: { tag: CASHTAG } },
    { path: `/feed/${SEGMENT_HASHTAG}/:tag`, component: () => import("./pages/MewsWithHashtag.vue"), meta: { tag: HASHTAG } },
    { path: '/:pathMatch(.*)', component: () => import("./pages/NotFound.vue") }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;