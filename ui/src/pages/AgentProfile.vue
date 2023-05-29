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
            <div class="q-mr-lg text-primary text-weight-medium">
              {{ profile?.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
            </div>
            <div class="text-primary">@{{ profile?.nickname }}</div>
          </div>
          <ButtonFollow
            v-if="!isMyProfile"
            :agentPubKey="agentPubKey"
            @toggle-follow="forceReloadFollowersListKey += 1"
          />
          <QBtn
            v-if="isMyProfile"
            icon="edit"
            @click="showEditProfileForm = true"
          >
            <span class="q-pl-sm">Edit Profile</span></QBtn
          >
        </QCardSection>

        <QCardSection v-if="!showEditProfileForm" class="flex">
          <div class="q-mr-md">
            <div>
              <label class="text-weight-medium">Bio:</label>
            </div>
            <div>
              <label class="text-weight-medium">Location:</label>
            </div>
          </div>
          <div class="col-grow">
            <div>{{ profile?.fields[PROFILE_FIELDS.BIO] }}</div>
            <div>{{ profile?.fields[PROFILE_FIELDS.LOCATION] }}</div>
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
      <div class="row justify-center">
        <QBtn
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
    </div>

    <div class="follow-col col self-start q-pl-xl q-pr-md">
      <h6 class="q-mt-none q-mb-md">Following</h6>
      <FolloweesList :agentPubKey="agentPubKey" />
      <h6 class="q-mb-md">Followed by</h6>
      <FollowersList
        :key="forceReloadFollowersListKey"
        :agentPubKey="agentPubKey"
      />
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
import FolloweesList from "@/components/FolloweesList.vue";
import FollowersList from "@/components/FollowersList.vue";
import { PROFILE_FIELDS } from "@/types/types";
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
import { AppAgentClient } from "@holochain/client";
import { useQuery } from "@tanstack/vue-query";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const router = useRouter();
const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agentPubKey as string)
);
const forceReloadFollowersListKey = ref(0);
const showEditProfileForm = ref(false);

const isMyProfile = computed(() =>
  isEqual(agentPubKey.value, client.myPubKey as AgentPubKey)
);

const fetchAuthoredMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: {
      agent: agentPubKey.value,
      page: {
        limit: 5,
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
  refetchOnMount: "always",
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
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
  refetchOnMount: "always",
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
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
  refetchOnMount: "always",
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
});
watch(errorProfile, showError);

const onEditProfile = () => {
  showEditProfileForm.value = false;
  refetch();
};
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y") + 10
</style>
