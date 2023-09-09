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
import { ComputedRef, computed, inject, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseList from "@/components/BaseList.vue";
import { AppAgentClient } from "@holochain/client";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import EditAgentProfileDialog from "@/components/EditAgentProfileDialog.vue";
import FollowersListDialog from "@/components/FollowersListDialog.vue";
import CreatorsListDialog from "@/components/CreatorsListDialog.vue";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
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
});
watch(errorPinnedMews, console.error);

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(agentPubKey.value);

  if (profile) {
    return profile;
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
});
watch(errorProfile, console.error);

const fetchJoinedTimestamp = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: agentPubKeyB64,
  });

const { data: joinedTimestamp, error: errorJoinedTimestamp } = useQuery({
  queryKey: ["profiles", "get_joining_timestamp_for_agent", agentPubKeyB64],
  queryFn: fetchJoinedTimestamp,
});
watch(errorJoinedTimestamp, console.error);

const fetchCreatorsCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_creators_for_follower",
    payload: agentPubKey.value,
  });

const { data: creatorsCount, error: errorCreatorsCount } = useQuery({
  queryKey: ["follows", "count_creators_for_follower", agentPubKeyB64],
  queryFn: fetchCreatorsCount,
});
watch(errorCreatorsCount, console.error);

const fetchFollowersCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_followers_for_creator",
    payload: agentPubKey.value,
  });

const {
  data: followersCount,
  error: errorFollowersCount,
  refetch: refetchFollowersCount,
} = useQuery({
  queryKey: ["follows", "count_followers_for_creator", agentPubKeyB64],
  queryFn: fetchFollowersCount,
});
watch(errorFollowersCount, console.error);
</script>
