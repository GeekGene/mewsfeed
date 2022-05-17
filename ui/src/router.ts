import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { TAG_SYMBOLS } from "./types/types";

export const PATH = {
  [TAG_SYMBOLS.CASHTAG]: "cashtag",
  [TAG_SYMBOLS.HASHTAG]: "hashtag",
  [TAG_SYMBOLS.MENTION]: "handle",
};

export const ROUTES = {
  home: "home",
  myProfile: "myProfile",
  profiles: "profiles",
  feed: "feed",
  [PATH[TAG_SYMBOLS.CASHTAG]]: PATH[TAG_SYMBOLS.CASHTAG],
  [PATH[TAG_SYMBOLS.HASHTAG]]: PATH[TAG_SYMBOLS.HASHTAG],
  [PATH[TAG_SYMBOLS.MENTION]]: PATH[TAG_SYMBOLS.MENTION],
};

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: ROUTES.home,
    component: () => import("./pages/HomePage.vue"),
  },
  {
    path: "/my-profile/",
    name: ROUTES.myProfile,
    component: () => import("./pages/MyProfile.vue"),
  },
  {
    path: "/profiles/:agent",
    name: ROUTES.profiles,
    component: () => import("./pages/AgentProfile.vue"),
  },
  {
    path: "/feed",
    name: ROUTES.feed,
    component: () => import("./pages/MewsFeed.vue"),
  },
  {
    path: `/${PATH[TAG_SYMBOLS.CASHTAG]}/:tag`,
    name: ROUTES[PATH[TAG_SYMBOLS.CASHTAG]],
    component: () => import("./pages/TagMewsFeed.vue"),
    meta: { tag: TAG_SYMBOLS.CASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.HASHTAG]}/:tag`,
    name: ROUTES[PATH[TAG_SYMBOLS.HASHTAG]],
    component: () => import("./pages/TagMewsFeed.vue"),
    meta: { tag: TAG_SYMBOLS.HASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.MENTION]}/:tag`,
    name: ROUTES[PATH[TAG_SYMBOLS.MENTION]],
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
