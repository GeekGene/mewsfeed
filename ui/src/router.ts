import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { TAG_SYMBOLS } from "./utils/tags";
import DiscoverCreators from "./pages/DiscoverCreators.vue";
import MewsFeed from "./pages/MewsFeed.vue";
import AgentProfile from "./pages/AgentProfile.vue";
import MewYarn from "./pages/MewYarn.vue";
import CashtagMewsFeed from "./pages/CashtagMewsFeed.vue";
import HashtagMewsFeed from "./pages/CashtagMewsFeed.vue";
import MentionMewsFeed from "./pages/MentionMewsFeed.vue";
import NotFound from "./pages/NotFound.vue";
import MyNotifications from "./pages/MyNotifications.vue";

export const PATH = {
  [TAG_SYMBOLS.CASHTAG]: "cashtag",
  [TAG_SYMBOLS.HASHTAG]: "hashtag",
  [TAG_SYMBOLS.MENTION]: "handle",
};

export const ROUTES = {
  discover: "discover",
  profile: "profile",
  notifications: "notifications",
  feed: "feed",
  yarn: "yarn",
  [PATH[TAG_SYMBOLS.CASHTAG]]: PATH[TAG_SYMBOLS.CASHTAG],
  [PATH[TAG_SYMBOLS.HASHTAG]]: PATH[TAG_SYMBOLS.HASHTAG],
  [PATH[TAG_SYMBOLS.MENTION]]: PATH[TAG_SYMBOLS.MENTION],
};

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: ROUTES.feed,
    component: MewsFeed,
  },
  {
    path: "/profiles/:agent",
    name: ROUTES.profile,
    component: AgentProfile,
  },
  {
    path: "/notifications",
    name: ROUTES.notifications,
    component: MyNotifications,
  },
  {
    path: "/discover",
    name: ROUTES.discover,
    component: DiscoverCreators,
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
