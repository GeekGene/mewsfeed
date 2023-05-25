import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { TAG_SYMBOLS } from "./utils/tags";
import DiscoverCreators from "./pages/DiscoverCreators.vue";
import MewsFeed from "./pages/MewsFeed.vue";
import AgentProfile from "./pages/AgentProfile.vue";
import MewYarn from "./pages/MewYarn.vue";
import CashtagMewsFeed from "./pages/CashtagMewsFeed.vue";
import HashtagMewsFeed from "./pages/HashtagMewsFeed.vue";
import MentionMewsFeed from "./pages/MentionMewsFeed.vue";
import NotFound from "./pages/NotFound.vue";
import MyNotifications from "./pages/MyNotifications.vue";

export const ROUTES = {
  discover: "discover",
  profile: "profile",
  notifications: "notifications",
  feed: "feed",
  yarn: "yarn",
  hashtag: "hashtag",
  cashtag: "cashtag",
  mention: "mention",
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
    path: `/cashtag/:tag`,
    name: ROUTES.cashtag,
    component: CashtagMewsFeed,
    meta: { tag: TAG_SYMBOLS.CASHTAG },
  },
  {
    path: `/hashtag/:tag`,
    name: ROUTES.hashtag,
    component: HashtagMewsFeed,
    meta: { tag: TAG_SYMBOLS.HASHTAG },
  },
  {
    path: `/mention/:tag/:agentPubKey`,
    name: ROUTES.mention,
    component: MentionMewsFeed,
    meta: { tag: TAG_SYMBOLS.MENTION },
  },
  { path: "/:pathMatch(.*)", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
