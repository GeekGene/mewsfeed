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

      <h6 class="q-mb-md">Mews</h6>
      <EmptyMewsFeed v-if="!loadingMews && mews.length === 0" />
      <MewList
        v-else
        :is-loading="loadingMews"
        :mews="mews"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
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
import {
  followers,
  following,
  getFeedMewAndContext,
  mewsBy,
} from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/stores/profiles";
import { FeedMew, MewType, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError, showMessage } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { PATH, ROUTES } from "@/router";
import { TAG_SYMBOLS } from "@/utils/tags";
import {
  ActionHash,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { Profile } from "@holochain-open-dev/profiles";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MewList from "../components/MewList.vue";

const profilesStore = useProfilesStore();
const route = useRoute();
const router = useRouter();
const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agent as string)
);
const loadingMews = ref(false);
const loadingProfile = ref(false);
const profile = ref<Profile>();
const isFollowing = ref(false);
const mews = ref<FeedMew[]>([]);

const isMyProfile = computed(() =>
  isSameHash(agentPubKey.value, profilesStore.value.client.client.myPubKey)
);

const loadMews = async () => {
  try {
    loadingMews.value = true;
    mews.value = await mewsBy(agentPubKey.value);
  } catch (error) {
    showError(error);
  } finally {
    loadingMews.value = false;
  }
};

const loadProfile = async () => {
  try {
    loadingProfile.value = true;
    const [profileData, myFollowing, myFollowers] = await Promise.all([
      profilesStore.value.client.getAgentProfile(agentPubKey.value),
      following(agentPubKey.value),
      followers(agentPubKey.value),
    ]);

    if (profileData) {
      profile.value = profileData;
    }
    isFollowing.value = myFollowing.includes(agentPubKey.value);
  } catch (error) {
    showError(error);
  } finally {
    loadingProfile.value = false;
  }
};

const load = () => {
  loadProfile();
  loadMews();
};

onMounted(load);

watch(
  () => route.params.agent,
  (value) => {
    if (value) {
      load();
    }
  }
);

const onToggleLickMew = async (hash: ActionHash) => {
  try {
    const index = mews.value.findIndex((mew) =>
      isSameHash(hash, mew.action_hash)
    );
    if (index !== -1) {
      mews.value[index] = await getFeedMewAndContext(hash);
    }
  } catch (error) {
    showError(error);
  }
};

const onPublishMew = async (mewType: MewType) => {
  loadMews();
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
