<template>
  <div class="row" :style-fn="pageHeightCorrection">
    <div v-if="!isLoadingProfile && agentPubKey">
      <BaseAgentProfileDetail
        v-if="!showEditProfileForm"
        :agentPubKey="agentPubKey"
        :creators-count="25"
        :followers-count="5"
        class="bg-neutral/5 backdrop-blur-md p-4 rounded-3xl"
        @click-edit-profile="showEditProfileForm = true"
      />

      <div
        v-else
        class="bg-neutral/5 backdrop-blur-md p-4 rounded-3xl pl-8 pr-8 pb-8"
      >
        <update-profile
          :profile="profile"
          @profile-updated="onEditProfile"
          @cancel-edit-profile="showEditProfileForm = false"
        ></update-profile>
      </div>

      <BaseList
        v-slot="{ item }"
        class="my-8"
        title="pinned"
        :feed-mews="pinnedMews"
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
        :feed-mews="authoredMews"
        :is-loading="isLoadingAuthoredMews"
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

      <RouterLink
        v-if="authoredMews && authoredMews.length === pageLimit"
        class="btn btn-md btn-ghost"
        :to="{
          name: 'authoredMews',
          params: {
            agentPubKey: route.params.agentPubKey,
          },
        }"
      >
        View All
      </RouterLink>
    </div>

    <div class="follow-col col self-start q-pl-xl q-pr-md">
      <h6 class="q-mt-none q-mb-md">Following</h6>
      <BaseAgentProfilesList
        :agent-profiles="creators"
        :loading="isLoadingCreators"
      />
      <RouterLink
        v-if="creators?.length === pageLimit"
        class="btn btn-md btn-ghost"
        :to="{
          name: 'creators',
          params: {
            agentPubKey: route.params.agentPubKey,
          },
        }"
      >
        View All
      </RouterLink>

      <h6 class="q-mb-md">Followed by</h6>
      <BaseAgentProfilesList
        :agent-profiles="followers"
        :loading="isLoadingFollowers"
      />
      <div v-if="followers?.length === pageLimit" class="row justify-center">
        <RouterLink
          class="btn btn-md btn-neutral"
          :to="{
            name: 'followers',
            params: {
              agentPubKey: route.params.agentPubKey,
            },
          }"
        >
          View All
        </RouterLink>
      </div>

      <h6 class="q-mb-md">
        <RouterLink
          v-if="profile?.nickname"
          class="btn btn-md btn-primary"
          :to="{
            name: ROUTES.mention,
            params: {
              tag: profile.nickname,
              agentPubKey: encodeHashToBase64(agentPubKey),
            },
          }"
        >
          Mew Mentions
        </RouterLink>
      </h6>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QPage, QSpinnerPie, QCard, QCardSection, QBtn } from "quasar";
import { AgentProfile } from "@/types/types";
import isEqual from "lodash/isEqual";
import { showError } from "@/utils/toasts";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ROUTES } from "@/router";
import {
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, computed, inject, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseList from "@/components/BaseList.vue";
import BaseAgentProfilesList from "@/components/BaseAgentProfilesList.vue";
import { AppAgentClient } from "@holochain/client";
import { useQuery } from "@tanstack/vue-query";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const router = useRouter();
const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agentPubKey as string)
);
const showEditProfileForm = ref(false);

const isMyProfile = computed(() =>
  isEqual(agentPubKey.value, client.myPubKey as AgentPubKey)
);

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
  refetch,
} = useQuery({
  queryKey: [
    "profiles",
    "getAgentProfile",
    encodeHashToBase64(agentPubKey.value),
  ],
  queryFn: fetchProfile,
});
watch(errorProfile, showError);

const onEditProfile = () => {
  showEditProfileForm.value = false;
  refetch();
};

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

const {
  data: followers,
  isLoading: isLoadingFollowers,
  error: errorFollowers,
  refetch: refetchFollowers,
} = useQuery({
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

const {
  data: creators,
  isLoading: isLoadingCreators,
  error: errorCreators,
} = useQuery({
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
