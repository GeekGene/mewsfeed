<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <MewList
      :key="forceReloadMewsList"
      :show-create-mew-field="true"
      :fetch-fn="fetchMewsFeed"
      title="Your Mews Feed"
      :cache-key="`mews/get_my_followed_creators_mews_with_context`"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject, watch, ref } from "vue";
import { FeedMew } from "@/types/types";
import MewList from "@/components/MewList.vue";
import { useRouter } from "vue-router";
import { ROUTES } from "@/router";
import { useRequest } from "vue-request";
import { Profile } from "@holochain-open-dev/profiles";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = (inject("myProfile") as ComputedRef<Profile>).value;

const forceReloadMewsList = ref(0);
const router = useRouter();

const fetchMewsFeed = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_my_followed_creators_mews_with_context",
    payload: null,
  });

const fetchFollowedCreators = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_creators_for_follower",
    payload: client.myPubKey,
  });

const { data } = useRequest(fetchFollowedCreators, {
  cacheKey: `follows/get_creators_for_follower/${client.myPubKey}`,
  loadingDelay: 1000,
});

watch(data, (val) => {
  if (val && val.length === 0 && !myProfile) {
    router.push({ name: ROUTES.discover });
  } else {
    router.push({ name: ROUTES.feed });
  }
});
</script>
