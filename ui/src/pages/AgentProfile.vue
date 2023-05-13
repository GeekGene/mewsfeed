<template>
  <QPage class="row" :style-fn="pageHeightCorrection">
    <div class="col-8">
      <h6 class="q-mt-none q-mb-md">Profile</h6>
      <QSpinnerPie
        v-if="loadingProfile || !agentPubKey"
        size="10%"
        color="primary"
      />

      <QCard v-else v-bind="$attrs" square class="q-mb-md text-body1">
        <QCardSection class="flex justify-between">
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
          <ButtonFollow v-if="!isMyProfile" :agentPubKey="agentPubKey" />
        </QCardSection>

        <QCardSection class="flex">
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

      <BaseMewList
        title="Mews"
        :is-loading="loading"
        :feed-mews="data"
        @toggle-lick-mew="fetchMew"
        @publish-mew="onPublishMew"
      />
    </div>

    <div class="follow-col col self-start q-pl-xl q-pr-md">
      <h6 class="q-mt-none q-mb-md">Following</h6>
      <FolloweesList :agentPubKey="agentPubKey" />
      <h6 class="q-mb-md">Followed by</h6>
      <FollowersList :agentPubKey="agentPubKey" />
      <h6 class="q-mb-md">
        <QBtn
          v-if="profile?.nickname"
          size="lg"
          color="secondary"
          @click="
            router.push({
              name: ROUTES[PATH[TAG_SYMBOLS.MENTION]],
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
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";
import FolloweesList from "@/components/FolloweesList.vue";
import FollowersList from "@/components/FollowersList.vue";
import { FeedMew, MewType, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import isEqual from "lodash/isEqual";
import { showError, showMessage } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { PATH, ROUTES } from "@/router";
import { TAG_SYMBOLS } from "@/utils/tags";
import {
  ActionHash,
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, computed, inject, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseMewList from "../components/BaseMewList.vue";
import { AppAgentClient } from "@holochain/client";
import { useRequest } from "vue-request";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const router = useRouter();
const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agent as string)
);
const loadingProfile = ref(false);
const profile = ref<Profile>();
const isFollowingMe = ref(false);

const isMyProfile = computed(() =>
  isEqual(agentPubKey.value, client.myPubKey as AgentPubKey)
);

const fetchAgentMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: agentPubKey.value,
  });

const loadProfile = async () => {
  try {
    loadingProfile.value = true;
    const [profileData, agentFollowing] = await Promise.all([
      profilesStore.client.getAgentProfile(agentPubKey.value),
      client.callZome({
        role_name: "mewsfeed",
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: agentPubKey.value,
      }),
    ]);

    if (profileData) {
      profile.value = profileData;
    }
    isFollowingMe.value = agentFollowing.includes(client.myPubKey);
  } catch (error) {
    showError(error);
  } finally {
    loadingProfile.value = false;
  }
};

onMounted(loadProfile);

watch(
  () => route.params.agent,
  (value) => {
    if (value) {
      loadProfile();
    }
  }
);

const { data, loading, error, run } = useRequest(fetchAgentMews, {
  initialData: [],
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
});
watch(error, showError);

const fetchMew = async (actionHash: ActionHash) => {
  if (data.value === undefined) return;

  const mew: FeedMew = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash,
  });

  const index = data.value.findIndex((mew: FeedMew) =>
    isEqual(actionHash, mew.action_hash)
  );

  if (index !== -1) {
    // Replace mew if already exists in data
    data.value[index] = mew;
  } else {
    // Insert mew at beginning of list if not
    data.value.unshift(mew);
  }
};

const onPublishMew = async (mewType: MewType) => {
  run();
  showMessage(
    MewTypeName.Reply in mewType
      ? "Replied to mew"
      : MewTypeName.Mewmew in mewType
      ? "Mew mewmewed"
      : "Quoted mew"
  );
};
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y")
</style>
