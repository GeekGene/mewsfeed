<template>
  <div class="mt-4">
    <div v-if="!isInitialLoadingProfile && agentPubKey">
      <BaseAgentProfileDetail
        :profile="profile"
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
        @profile-updated="(profile: any) => {
          refetchProfile();
          queryClient.setQueryData([
              'profiles',
              'getAgentProfile',
              encodeHashToBase64(agentPubKey),
            ],
            profile
          );
        }"
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
          @mew-pinned="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-unpinned="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-deleted="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-licked="refetchPinnedMews"
          @mew-unlicked="refetchPinnedMews"
          @reply-created="refetchAuthoredMews"
          @mewmew-created="refetchAuthoredMews"
          @quote-created="refetchAuthoredMews"
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
          @mew-pinned="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-unpinned="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-deleted="
            () => {
              refetchPinnedMews();
              refetchAuthoredMews();
            }
          "
          @mew-licked="refetchAuthoredMews"
          @mew-unlicked="refetchAuthoredMews"
          @reply-created="refetchAuthoredMews"
          @mewmew-created="refetchAuthoredMews"
          @quote-created="refetchAuthoredMews"
        />
      </BaseList>
    </div>
  </div>
  <FollowersListDialog
    v-model="showFollowersListDialog"
    :agent-pub-key="agentPubKey"
  />
  <CreatorsListDialog
    v-model="showCreatorsListDialog"
    :agent-pub-key="agentPubKey"
  />
</template>

<script setup lang="ts">
import { decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, computed, inject, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseList from "@/components/BaseList.vue";
import { AppClient } from "@holochain/client";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import EditAgentProfileDialog from "@/components/EditAgentProfileDialog.vue";
import FollowersListDialog from "@/components/FollowersListDialog.vue";
import CreatorsListDialog from "@/components/CreatorsListDialog.vue";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppClient>).value;
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();

const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agentPubKey as string)
);
const showEditProfileDialog = ref(false);
const showFollowersListDialog = ref(false);
const showCreatorsListDialog = ref(false);
const agentPubKeyB64 = computed(() => route.params.agentPubKey);
const hasAgentPubKeyB64 = computed(() => agentPubKeyB64.value !== undefined);
const pageLimit = 5;

const fetchAuthoredMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: {
      agent: agentPubKey.value,
      page: {
        limit: pageLimit,
      },
    },
  });

const {
  data: authoredMews,
  isLoading: isLoadingAuthoredMews,
  error: errorAuthoredMews,
  refetch: refetchAuthoredMews,
} = useQuery({
  queryKey: ["profiles", "get_agent_mews_with_context", agentPubKeyB64],
  queryFn: fetchAuthoredMews,
  enabled: hasAgentPubKeyB64,
});
watch(errorAuthoredMews, console.error);

const fetchPinnedMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_pinner_with_context",
    payload: agentPubKey.value,
  });

const {
  data: pinnedMews,
  isLoading: isLoadingPinnedMews,
  error: errorPinnedMews,
  refetch: refetchPinnedMews,
} = useQuery({
  queryKey: ["profiles", "get_mews_for_pinner_with_context", agentPubKeyB64],
  queryFn: fetchPinnedMews,
  enabled: hasAgentPubKeyB64,
});
watch(errorPinnedMews, console.error);

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(agentPubKey.value);

  if (profile?.entry) {
    return profile.entry;
  } else {
    throw new Error("No profile found");
  }
};

const {
  data: profile,
  isInitialLoading: isInitialLoadingProfile,
  error: errorProfile,
  refetch: refetchProfile,
} = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfile,
  refetchOnMount: true,
  enabled: hasAgentPubKeyB64,
});
watch(errorProfile, console.error);

const fetchJoinedTimestamp = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: route.params.agentPubKey,
  });

const {
  data: joinedTimestamp,
  error: errorJoinedTimestamp,
  refetch: refetchJoinedTimestamp,
} = useQuery({
  queryKey: ["profiles", "get_joining_timestamp_for_agent", agentPubKeyB64],
  queryFn: fetchJoinedTimestamp,
  enabled: hasAgentPubKeyB64,
});
watch(errorJoinedTimestamp, console.error);

const fetchCreatorsCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_creators_for_follower",
    payload: route.params.agentPubKey,
  });

const {
  data: creatorsCount,
  error: errorCreatorsCount,
  refetch: refetchCreatorsCount,
} = useQuery({
  queryKey: ["follows", "count_creators_for_follower", agentPubKeyB64],
  queryFn: fetchCreatorsCount,
  enabled: hasAgentPubKeyB64,
});
watch(errorCreatorsCount, console.error);

const fetchFollowersCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_followers_for_creator",
    payload: route.params.agentPubKey,
  });

const {
  data: followersCount,
  error: errorFollowersCount,
  refetch: refetchFollowersCount,
} = useQuery({
  queryKey: ["follows", "count_followers_for_creator", agentPubKeyB64],
  queryFn: fetchFollowersCount,
  enabled: hasAgentPubKeyB64,
});
watch(errorFollowersCount, console.error);

watch(route, (newVal) => {
  console.log("new route is ", newVal);
  nextTick(() => {
    refetchProfile();
    refetchAuthoredMews();
    refetchPinnedMews();
    refetchJoinedTimestamp();
    refetchFollowersCount();
    refetchCreatorsCount();
  });
});
</script>
