import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import { TAG_SYMBOLS } from "./utils/tags";
import DiscoverCreators from "./pages/DiscoverCreators.vue";
import MewsFeed from "./pages/MewsFeed.vue";
import AgentProfile from "./pages/AgentProfile.vue";
import MewYarn from "./pages/MewYarn.vue";
import MewsListCashtag from "./pages/MewsListCashtag.vue";
import MewsListHashtag from "./pages/MewsListHashtag.vue";
import MewsListMention from "./pages/MewsListMention.vue";
import MewsListAuthor from "./pages/MewsListAuthor.vue";
import NotFound from "./pages/NotFound.vue";
import MyNotifications from "./pages/MyNotifications.vue";
import { getHomeRedirect } from "./utils/homeRedirect";

export const ROUTES = {
  discover: "discover",
  profile: "profile",
  authoredMews: "authoredMews",
  creators: "creators",
  followers: "followers",
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
    beforeEnter: () => {
      if (getHomeRedirect()) return { name: ROUTES.discover };
    },
    component: MewsFeed,
  },
  {
    path: "/profiles/:agentPubKey",
    name: ROUTES.profile,
    component: AgentProfile,
  },
  {
    path: "/profiles/:agentPubKey/mews",
    name: ROUTES.authoredMews,
    component: MewsListAuthor,
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
    path: "/yarn/:actionHash",
    name: ROUTES.yarn,
    component: MewYarn,
  },
  {
    path: `/cashtag/:tag`,
    name: ROUTES.cashtag,
    component: MewsListCashtag,
    meta: { tag: TAG_SYMBOLS.CASHTAG },
  },
  {
    path: `/hashtag/:tag`,
    name: ROUTES.hashtag,
    component: MewsListHashtag,
    meta: { tag: TAG_SYMBOLS.HASHTAG },
  },
  {
    path: `/mention/:tag/:agentPubKey`,
    name: ROUTES.mention,
    component: MewsListMention,
    meta: { tag: TAG_SYMBOLS.MENTION },
  },
  { path: "/:pathMatch(.*)", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
