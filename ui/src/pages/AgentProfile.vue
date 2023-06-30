<template>
  <div>
    <div v-if="!isLoadingProfile && agentPubKey">
      <BaseAgentProfileDetail
        :profile="profile"
        :agentPubKey="agentPubKey"
        :creators-count="creators ? creators.length : 0"
        :followers-count="followers ? followers.length : 0"
        class="bg-neutral/5 backdrop-blur-md p-4 rounded-3xl"
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
      />
      <EditAgentProfileDialog
        v-model="showEditProfileDialog"
        :profile="profile"
        @profile-updated="(e: any) => {
          refetchProfile();
          queryClient.setQueryData([
              'profiles',
              'getAgentProfile',
              encodeHashToBase64(agentPubKey),
            ],
            e.detail.profile
          );
        }"
      />

      <BaseList
        v-slot="{ item }"
        class="my-8"
        title="pinned"
        :items="pinnedMews"
        :is-loading="isLoadingPinnedMews"
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
          @mew-licked="refetchPinnedMews"
          @mew-unlicked="refetchPinnedMews"
          @reply-created="refetchAuthoredMews"
          @mewmew-created="refetchAuthoredMews"
          @quote-created="refetchAuthoredMews"
        />
      </BaseList>

      <BaseList
        v-slot="{ item }"
        class="my-8"
        title="mews"
        :items="authoredMews"
        :is-loading="isLoadingAuthoredMews"
        enable-more-button
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
import { showError } from "@/utils/toasts";
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
watch(errorAuthoredMews, showError);

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
watch(errorPinnedMews, showError);

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
  isLoading: isLoadingProfile,
  error: errorProfile,
  refetch: refetchProfile,
} = useQuery({
  queryKey: [
    "profiles",
    "getAgentProfile",
    encodeHashToBase64(agentPubKey.value),
  ],
  queryFn: fetchProfile,
});
watch(errorProfile, showError);

const fetchFollowers = async () => {
  const agents: AgentPubKey[] = await await client.callZome({
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
watch(errorFollowers, showError);

const fetchCreators = async () => {
  const agents: AgentPubKey[] = await await client.callZome({
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
watch(errorCreators, showError);
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y") + 10
</style>
