<template>
  <div class="mt-4">
    <div v-if="!isLoadingProfile && agentPubKey">
      <BaseAgentProfileDetail
        :key="profileVersion"
        :profile="profile ?? undefined"
        :joined-timestamp="joinedTimestamp"
        :agentPubKey="agentPubKey"
        :creators-count="creatorsCount || 0"
        :followers-count="followersCount || 0"
        class="bg-base-200/75 rounded-3xl"
        style="-webkit-backdrop-filter: blur(10px)"
        enable-copy-agent-pub-key
        enable-lightbox-on-avatar-click
        @click-edit-profile="showEditProfileDialog = true"
        @click-followers="
          () => {
            if (followersCount && followersCount > 0)
              showFollowersListDialog = true;
          }
        "
        @click-creators="
          () => {
            if (creatorsCount && creatorsCount > 0)
              showCreatorsListDialog = true;
          }
        "
        @toggle-follow="refetchFollowersCount"
      />
      <EditAgentProfileDialog
        v-if="profile"
        v-model="showEditProfileDialog"
        :profile="profile"
        @profile-updated="() => refreshProfile()"
      />

      <BaseList
        v-slot="{ item }"
        class="my-8 px-4"
        title="pinned"
        :items="pinnedMews"
        :is-loading="isLoadingPinnedMews"
        :show-empty-list="false"
      >
        <BaseMewListItem
          :feed-mew="item"
          @mew-pinned="patchPinnedAndRefresh"
          @mew-unpinned="patchPinnedAndRefresh"
          @mew-deleted="patchPinnedAndRefresh"
          @mew-licked="patchPinnedMew"
          @mew-unlicked="patchPinnedMew"
          @reply-created="patchPinnedMew"
          @mewmew-created="patchPinnedMew"
          @quote-created="patchPinnedMew"
        />
      </BaseList>

      <BaseList
        v-slot="{ item }"
        class="my-8 px-4"
        title="mews"
        :items="authoredMews"
        :is-loading="isLoadingAuthoredMews"
        :enable-more-button="authoredMews && authoredMews.length >= pageLimit"
        @click-more="
          router.push({
            name: 'authoredMews',
            params: {
              agentPubKey: route.params.agentPubKey,
            },
          })
        "
      >
        <BaseMewListItem
          :feed-mew="item"
          @mew-pinned="patchAuthoredAndRefreshPins"
          @mew-unpinned="patchAuthoredAndRefreshPins"
          @mew-deleted="patchAuthoredAndRefreshPins"
          @mew-licked="patchAuthoredMew"
          @mew-unlicked="patchAuthoredMew"
          @reply-created="patchAuthoredMew"
          @mewmew-created="patchAuthoredMew"
          @quote-created="patchAuthoredMew"
        />
      </BaseList>
    </div>
  </div>
  <FollowersListDialog
    v-if="agentPubKey"
    v-model="showFollowersListDialog"
    :agent-pub-key="agentPubKey"
  />
  <CreatorsListDialog
    v-if="agentPubKey"
    v-model="showCreatorsListDialog"
    :agent-pub-key="agentPubKey"
  />
</template>

<script setup lang="ts">
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, nextTick, onActivated, ref, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import { useProfile } from "@/composables/useProfile";
import { useRoute, useRouter } from "vue-router";
import BaseList from "@/components/BaseList.vue";
import { AppClient } from "@holochain/client";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import EditAgentProfileDialog from "@/components/EditAgentProfileDialog.vue";
import FollowersListDialog from "@/components/FollowersListDialog.vue";
import CreatorsListDialog from "@/components/CreatorsListDialog.vue";
import { wrapInput } from "@/utils/zomeCall";
import { usePatchFeedMew } from "@/composables/usePatchFeedMew";
import { FeedMew } from "@/types/types";

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const { patchFeedMew } = usePatchFeedMew();

const agentPubKey = computed(() => {
  const key = route.params.agentPubKey as string;
  return key ? decodeHashFromBase64(key) : undefined;
});
const showEditProfileDialog = ref(false);
const showFollowersListDialog = ref(false);
const showCreatorsListDialog = ref(false);
const agentPubKeyB64 = computed(() => route.params.agentPubKey);
const hasAgentPubKeyB64 = computed(() => agentPubKeyB64.value !== undefined);
const pageLimit = 5;

const fetchAuthoredMews = () => {
  if (!agentPubKey.value) return [];
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: wrapInput({
      agent: agentPubKey.value,
      page: {
        limit: pageLimit,
      },
    }),
  });
};

const authoredMewsQueryKey = ["profiles", "get_agent_mews_with_context", agentPubKeyB64];

const patchAuthoredMew = (updatedMew: FeedMew) => {
  patchFeedMew(authoredMewsQueryKey, updatedMew);
};

const {
  data: authoredMews,
  isLoading: isLoadingAuthoredMews,
  error: errorAuthoredMews,
  refetch: refetchAuthoredMews,
} = useQuery({
  queryKey: authoredMewsQueryKey,
  queryFn: fetchAuthoredMews,
  enabled: computed(() => cellsReady.value && hasAgentPubKeyB64.value),
});
watch(errorAuthoredMews, console.error);

const fetchPinnedMews = () => {
  if (!agentPubKey.value) return [];
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_pinner_with_context",
    payload: wrapInput(agentPubKey.value),
  });
};

const pinnedMewsQueryKey = ["profiles", "get_mews_for_pinner_with_context", agentPubKeyB64];

const patchPinnedMew = (updatedMew: FeedMew) => {
  patchFeedMew(pinnedMewsQueryKey, updatedMew);
};

const {
  data: pinnedMews,
  isLoading: isLoadingPinnedMews,
  error: errorPinnedMews,
  refetch: refetchPinnedMews,
} = useQuery({
  queryKey: pinnedMewsQueryKey,
  queryFn: fetchPinnedMews,
  enabled: computed(() => cellsReady.value && hasAgentPubKeyB64.value),
});
watch(errorPinnedMews, console.error);

const patchPinnedAndRefresh = (m: FeedMew) => {
  patchPinnedMew(m);
  patchAuthoredMew(m);
  refetchPinnedMews();
};

const patchAuthoredAndRefreshPins = (m: FeedMew) => {
  patchAuthoredMew(m);
  refetchPinnedMews();
};

const {
  profile,
  isLoading: isLoadingProfile,
  profileVersion,
  refresh: refreshProfile,
} = useProfile(agentPubKey);

const fetchJoinedTimestamp = () => {
  if (!agentPubKey.value) return null;
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: wrapInput(agentPubKey.value),
  });
};

const {
  data: joinedTimestamp,
  error: errorJoinedTimestamp,
} = useQuery({
  queryKey: ["profiles", "get_joining_timestamp_for_agent", agentPubKeyB64],
  queryFn: fetchJoinedTimestamp,
  staleTime: Infinity,
  cacheTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  enabled: computed(() => cellsReady.value && hasAgentPubKeyB64.value),
});
watch(errorJoinedTimestamp, console.error);

const fetchCreatorsCount = async (): Promise<number> => {
  if (!agentPubKey.value) return 0;
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "count_creators_for_follower",
    payload: wrapInput(agentPubKey.value),
  });
};

const {
  data: creatorsCount,
  error: errorCreatorsCount,
  refetch: refetchCreatorsCount,
} = useQuery({
  queryKey: ["follows", "count_creators_for_follower", agentPubKeyB64],
  queryFn: fetchCreatorsCount,
  enabled: computed(() => cellsReady.value && hasAgentPubKeyB64.value),
});
watch(errorCreatorsCount, console.error);

const fetchFollowersCount = async (): Promise<number> => {
  if (!agentPubKey.value) return 0;
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "count_followers_for_creator",
    payload: wrapInput(agentPubKey.value),
  });
};

const {
  data: followersCount,
  error: errorFollowersCount,
  refetch: refetchFollowersCount,
} = useQuery({
  queryKey: ["follows", "count_followers_for_creator", agentPubKeyB64],
  queryFn: fetchFollowersCount,
  enabled: computed(() => cellsReady.value && hasAgentPubKeyB64.value),
});
watch(errorFollowersCount, console.error);

watch(
  () => route.params.agentPubKey,
  (newKey) => {
    console.log("agentPubKey route param changed:", newKey);
    if (!newKey) return;
    nextTick(() => {
      refreshProfile();
      refetchAuthoredMews();
      refetchPinnedMews();
      refetchFollowersCount();
      refetchCreatorsCount();
    });
  }
);

// Refresh profile when navigating to this page (including via KeepAlive reactivation)
onActivated(() => refreshProfile());
</script>
