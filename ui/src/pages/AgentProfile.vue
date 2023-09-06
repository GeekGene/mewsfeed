<template>
  <div class="mt-4">
    <div v-if="!isInitialLoadingProfile && agentPubKey">
      <BaseAgentProfileDetail
        :profile="profileWithContext?.profile"
        :joined-timestamp="profileWithContext?.joinedTimestamp"
        :agentPubKey="agentPubKey"
        :creators-count="creatorsCount || 0"
        :followers-count="followersCount || 0"
        class="bg-base-200/75 rounded-3xl"
        style="-webkit-backdrop-filter: blur(10px)"
        enable-copy-agent-pub-key
        @click-edit-profile="showEditProfileDialog = true"
        @click-followers="
          () => {
            if (followers && followers.length > 0)
              showFollowersListDialog = true;
          }
        "
        @click-creators="
          () => {
            if (creators && creators.length > 0) showCreatorsListDialog = true;
          }
        "
        @toggle-follow="refetchFollowersCount"
      />
      <EditAgentProfileDialog
        v-if="profileWithContext"
        v-model="showEditProfileDialog"
        :profile="profileWithContext.profile"
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
        :enable-more-button="authoredMews.length >= pageLimit"
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
    :agent-pub-key="decodeHashFromBase64(route.params.agentPubKey as string)"
  />
  <CreatorsListDialog
    v-model="showCreatorsListDialog"
    :agent-pub-key="decodeHashFromBase64(route.params.agentPubKey as string)"
  />
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import {
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
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
  queryKey: [
    "profiles",
    "get_agent_mews_with_context",
    encodeHashToBase64(agentPubKey.value),
  ],
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
  queryKey: [
    "profiles",
    "get_mews_for_pinner_with_context",
    encodeHashToBase64(agentPubKey.value),
  ],
  queryFn: fetchPinnedMews,
});
watch(errorPinnedMews, console.error);

const fetchProfileWithContext = async () => {
  const profile = await profilesStore.client.getAgentProfile(agentPubKey.value);
  const joinedTimestamp = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: agentPubKey.value,
  });

  if (profile) {
    return {
      profile,
      joinedTimestamp,
    };
  } else {
    throw new Error("No profile found");
  }
};

const {
  data: profileWithContext,
  isInitialLoading: isInitialLoadingProfile,
  error: errorProfile,
  refetch: refetchProfile,
} = useQuery({
  queryKey: [
    "profiles",
    "getAgentProfile",
    encodeHashToBase64(agentPubKey.value),
  ],
  queryFn: fetchProfileWithContext,
});
watch(errorProfile, console.error);

const fetchFollowers = async () => {
  const agents: AgentPubKey[] = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_followers_for_creator",
    payload: {
      creator: decodeHashFromBase64(route.params.agentPubKey as string),
      page: {
        limit: pageLimit,
      },
    },
  });

  const agentProfiles = await Promise.all(
    agents.map(async (agentPubKey) => {
      const profile = await profilesStore.client.getAgentProfile(agentPubKey);
      if (!profile) return null;

      return {
        agentPubKey,
        profile: profile,
      };
    })
  );

  return agentProfiles.filter(Boolean) as AgentProfile[];
};

const { data: followers, error: errorFollowers } = useQuery({
  queryKey: [
    "follows",
    "get_followers_for_creator",
    route.params.agentPubKey as string,
  ],
  queryFn: fetchFollowers,
});
watch(errorFollowers, console.error);

const fetchCreators = async () => {
  const agents: AgentPubKey[] = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_creators_for_follower",
    payload: {
      follower: decodeHashFromBase64(route.params.agentPubKey as string),
      page: {
        limit: pageLimit,
      },
    },
  });

  const agentProfiles = await Promise.all(
    agents.map(async (agentPubKey) => {
      const profile = await profilesStore.client.getAgentProfile(agentPubKey);
      if (!profile) return null;

      return {
        agentPubKey,
        profile: profile,
      };
    })
  );

  return agentProfiles.filter(Boolean) as AgentProfile[];
};

const { data: creators, error: errorCreators } = useQuery({
  queryKey: [
    "follows",
    "get_creators_for_follower",
    route.params.agentPubKey as string,
  ],
  queryFn: fetchCreators,
});
watch(errorCreators, console.error);

const fetchCreatorsCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_creators_for_follower",
    payload: decodeHashFromBase64(route.params.agentPubKey as string),
  });

const { data: creatorsCount, error: errorCreatorsCount } = useQuery({
  queryKey: [
    "follows",
    "count_creators_for_follower",
    route.params.agentPubKey as string,
  ],
  queryFn: fetchCreatorsCount,
});
watch(errorCreatorsCount, console.error);

const fetchFollowersCount = async (): Promise<number> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "count_followers_for_creator",
    payload: decodeHashFromBase64(route.params.agentPubKey as string),
  });

const {
  data: followersCount,
  error: errorFollowersCount,
  refetch: refetchFollowersCount,
} = useQuery({
  queryKey: [
    "follows",
    "count_followers_for_creator",
    route.params.agentPubKey as string,
  ],
  queryFn: fetchFollowersCount,
});
watch(errorFollowersCount, console.error);
</script>
