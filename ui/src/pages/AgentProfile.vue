<template>
  <QPage class="row" :style-fn="pageHeightCorrection">
    <div class="col-8">
      <QSpinnerPie
        v-if="isLoadingProfile || !agentPubKey"
        size="10%"
        color="primary"
      />
      <QCard
        v-else-if="!showEditProfileForm"
        v-bind="$attrs"
        square
        class="q-mb-md text-body1"
      >
        <QCardSection v-if="!showEditProfileForm" class="flex justify-between">
          <div class="flex items-center">
            <agent-avatar
              :agentPubKey="agentPubKey"
              size="50"
              :class="['q-mr-lg', { 'cursor-pointer': !isMyProfile }]"
            />
            <BaseAgentProfileName
              :profile="profile"
              :agentPubKey="agentPubKey"
            />
          </div>
          <ButtonFollow
            v-if="!isMyProfile"
            :agentPubKey="agentPubKey"
            @toggle-follow="refetchFollowers"
          />
          <QBtn
            v-if="isMyProfile"
            icon="edit"
            @click="showEditProfileForm = true"
          >
            <span class="q-pl-sm">Edit Profile</span></QBtn
          >
        </QCardSection>

        <QCardSection v-if="!showEditProfileForm">
          <div
            v-if="
              profile?.fields[PROFILE_FIELDS.BIO] &&
              profile.fields[PROFILE_FIELDS.BIO].length > 0
            "
            class="row justify-start items-start q-mb-md"
          >
            <div>
              <label class="q-pr-sm text-weight-bold">Bio:</label>
            </div>
            <div class="col col-grow">
              {{ profile.fields[PROFILE_FIELDS.BIO] }}
            </div>
          </div>
          <div
            v-if="
              profile?.fields[PROFILE_FIELDS.LOCATION] &&
              profile.fields[PROFILE_FIELDS.LOCATION].length > 0
            "
            class="row justify-start items-start q-mb-md"
          >
            <div>
              <label class="q-pr-sm text-weight-bold">Location:</label>
            </div>
            <div class="col col-grow">
              {{ profile?.fields[PROFILE_FIELDS.LOCATION] }}
            </div>
          </div>
        </QCardSection>

        <div class="flex justify-end q-mx-sm">
          <holo-identicon :hash="agentPubKey" size="30"></holo-identicon>
        </div>
      </QCard>

      <QCard v-else square class="q-mb-md text-body1">
        <QCardSection v-if="showEditProfileForm" class="flex justify-between">
          <update-profile
            style="width: 100%"
            :profile="profile"
            @profile-updated="onEditProfile"
            @cancel-edit-profile="showEditProfileForm = false"
          ></update-profile>
        </QCardSection>
      </QCard>

      <BaseMewList
        title="Pinned Mews"
        :feed-mews="pinnedMews"
        :is-loading="isLoadingPinnedMews"
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

      <BaseMewList
        title="Authored Mews"
        :feed-mews="authoredMews"
        :is-loading="isLoadingAuthoredMews"
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
      <QBtn
        v-if="authoredMews && authoredMews.length === pageLimit"
        flat
        dense
        style="width: 100%"
        @click="
          router.push({
            name: 'authoredMews',
            params: {
              agentPubKey: route.params.agentPubKey,
            },
          })
        "
      >
        View All
      </QBtn>
    </div>

    <div class="follow-col col self-start q-pl-xl q-pr-md">
      <h6 class="q-mt-none q-mb-md">Following</h6>
      <BaseAgentProfilesList
        :agent-profiles="creators"
        :loading="isLoadingCreators"
      />
      <QBtn
        v-if="creators?.length === pageLimit"
        flat
        dense
        @click="
          router.push({
            name: 'creators',
            params: {
              agentPubKey: route.params.agentPubKey,
            },
          })
        "
      >
        View All
      </QBtn>

      <h6 class="q-mb-md">Followed by</h6>
      <BaseAgentProfilesList
        :agent-profiles="followers"
        :loading="isLoadingFollowers"
      />
      <div v-if="followers?.length === pageLimit" class="row justify-center">
        <QBtn
          flat
          dense
          @click="
            router.push({
              name: 'followers',
              params: {
                agentPubKey: route.params.agentPubKey,
              },
            })
          "
        >
          View All
        </QBtn>
      </div>

      <h6 class="q-mb-md">
        <QBtn
          v-if="profile?.nickname"
          size="lg"
          color="secondary"
          @click="
            router.push({
              name: ROUTES.mention,
              params: {
                tag: profile.nickname,
                agentPubKey: encodeHashToBase64(agentPubKey),
              },
            })
          "
        >
          Mew Mentions
        </QBtn>
      </h6>
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QSpinnerPie, QCard, QCardSection, QBtn } from "quasar";
import ButtonFollow from "@/components/ButtonFollow.vue";
import { AgentProfile, PROFILE_FIELDS } from "@/types/types";
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
import BaseMewList from "@/components/BaseMewList.vue";
import BaseAgentProfilesList from "@/components/BaseAgentProfilesList.vue";
import { AppAgentClient } from "@holochain/client";
import { useQuery } from "@tanstack/vue-query";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";

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
