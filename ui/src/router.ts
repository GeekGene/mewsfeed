import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { TAG_SYMBOLS } from "./types/types";

export const PATH = {
  [TAG_SYMBOLS.CASHTAG]: "cashtag",
  [TAG_SYMBOLS.HASHTAG]: "hashtag",
  [TAG_SYMBOLS.MENTION]: "handle",
};

const routes: RouteRecordRaw[] = [
  { path: "/", component: () => import("./pages/HomePage.vue") },
  { path: "/my-profile/", component: () => import("./pages/MyProfile.vue") },
  {
    path: "/profiles/:agent",
    component: () => import("./pages/AgentProfile.vue"),
  },
  { path: "/feed", component: () => import("./pages/MewsFeed.vue") },
  {
    path: `/${PATH[TAG_SYMBOLS.CASHTAG]}/:tag`,
    component: () => import("./pages/TagMewsFeed.vue"),
    meta: { tag: TAG_SYMBOLS.CASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.HASHTAG]}/:tag`,
    component: () => import("./pages/TagMewsFeed.vue"),
    meta: { tag: TAG_SYMBOLS.HASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.MENTION]}/:tag`,
    component: () => import("./pages/TagMewsFeed.vue"),
    meta: { tag: TAG_SYMBOLS.MENTION },
  },
  { path: "/:pathMatch(.*)", component: () => import("./pages/NotFound.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
