import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { TAG_SYMBOLS } from "./utils/tags";
import HomePage from "./pages/HomePage.vue";
import MewsFeed from "./pages/MewsFeed.vue";
import MyProfile from "./pages/MyProfile.vue";
import AgentProfile from "./pages/AgentProfile.vue";
import MewYarn from "./pages/MewYarn.vue";
import CashtagMewsFeed from "./pages/CashtagMewsFeed.vue";
import HashtagMewsFeed from "./pages/CashtagMewsFeed.vue";
import MentionMewsFeed from "./pages/MentionMewsFeed.vue";
import NotFound from "./pages/NotFound.vue";

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
  yarn: "yarn",
  [PATH[TAG_SYMBOLS.CASHTAG]]: PATH[TAG_SYMBOLS.CASHTAG],
  [PATH[TAG_SYMBOLS.HASHTAG]]: PATH[TAG_SYMBOLS.HASHTAG],
  [PATH[TAG_SYMBOLS.MENTION]]: PATH[TAG_SYMBOLS.MENTION],
};

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: ROUTES.home,
    component: HomePage,
  },
  {
    path: "/my-profile/",
    name: ROUTES.myProfile,
    component: MyProfile,
  },
  {
    path: "/profiles/:agent",
    name: ROUTES.profiles,
    component: AgentProfile,
  },
  {
    path: "/feed",
    name: ROUTES.feed,
    component: MewsFeed,
  },
  {
    path: "/yarn/:hash",
    name: ROUTES.yarn,
    component: MewYarn,
  },
  {
    path: `/${PATH[TAG_SYMBOLS.CASHTAG]}/:tag`,
    name: ROUTES[PATH[TAG_SYMBOLS.CASHTAG]],
    component: CashtagMewsFeed,
    meta: { tag: TAG_SYMBOLS.CASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.HASHTAG]}/:tag`,
    name: ROUTES[PATH[TAG_SYMBOLS.HASHTAG]],
    component: HashtagMewsFeed,
    meta: { tag: TAG_SYMBOLS.HASHTAG },
  },
  {
    path: `/${PATH[TAG_SYMBOLS.MENTION]}/:tag/:agentPubKey`,
    name: ROUTES[PATH[TAG_SYMBOLS.MENTION]],
    component: MentionMewsFeed,
    meta: { tag: TAG_SYMBOLS.MENTION },
  },
  { path: "/:pathMatch(.*)", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
