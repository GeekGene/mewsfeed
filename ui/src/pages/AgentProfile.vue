<template>
  <q-page class="row">
    <div class="col-8">
      <h6 class="q-mt-none q-mb-md">Profile</h6>
      <q-spinner-pie v-if="loadingProfile" size="10%" color="primary" />

      <q-card v-else v-bind="$attrs" square class="q-mb-md text-body1">
        <q-card-section class="flex justify-between">
          <div class="flex items-center">
            <agent-avatar
              :agentPubKey="agentPubKey"
              size="50"
              class="q-mr-lg"
            />
            <div class="q-mr-lg text-primary text-weight-medium">
              {{ displayName }}
            </div>
            <div class="text-primary">@{{ nickname }}</div>
          </div>
          <ButtonFollow v-if="!isMyProfile" :agent-pub-key="agentPubKey" />
        </q-card-section>

        <q-card-section class="flex">
          <div class="q-mr-md">
            <div>
              <label class="text-weight-medium">Bio:</label>
            </div>
            <div>
              <label class="text-weight-medium">Location:</label>
            </div>
          </div>
          <div class="col-grow">
            <div>{{ bio }}</div>
            <div>{{ location }}</div>
          </div>
        </q-card-section>
      </q-card>

      <h6 class="q-mb-md">Mews</h6>
      <MewList :loading="loadingMews" :mews="mews" @refresh="loadMews" />
    </div>

    <div class="col q-pl-xl q-pr-md">
      <h6 class="q-mt-none q-mb-md">Following</h6>
      <FolloweesList :agent-pub-key="agentPubKey" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import ButtonFollow from "@/components/ButtonFollow.vue";
import FolloweesList from "@/components/FolloweesList.vue";
import { mewsBy, myFollowing } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { FeedMew, PROFILE_FIELDS } from "@/types/types";
import { isSameAgentPubKey } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { Profile } from "@holochain-open-dev/profiles";
import { deserializeHash } from "@holochain-open-dev/utils";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import MewList from "../components/MewList.vue";

const profilesStore = useProfilesStore();
const route = useRoute();
const agentPubKey = computed(() => {
  const apg = deserializeHash(
    Array.isArray(route.params.agent)
      ? route.params.agent[0]
      : route.params.agent
  );
  console.log("apg", apg);
  return apg;
});
const loadingMews = ref(false);
const loadingProfile = ref(false);
const nickname = ref("");
const displayName = ref("");
const bio = ref("");
const location = ref("");
const isFollowing = ref(false);
const mews = ref<FeedMew[]>([]);

const isMyProfile = computed(() =>
  isSameAgentPubKey(agentPubKey.value, profilesStore.value.myAgentPubKey)
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
    const [profileReadable, currentMyFollowing] = await Promise.all([
      profilesStore.value.fetchAgentProfile(agentPubKey.value),
      myFollowing(),
    ]);
    let profile: Profile | undefined;
    profileReadable.subscribe((p) => (profile = p));
    if (profile) {
      nickname.value = profile.nickname;
      displayName.value = profile.fields[PROFILE_FIELDS.DISPLAY_NAME];
      bio.value = profile.fields[PROFILE_FIELDS.BIO];
      location.value = profile.fields[PROFILE_FIELDS.LOCATION];
    }
    isFollowing.value = currentMyFollowing.includes(agentPubKey.value);
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
  () => {
    if (route.params.agent) {
      load();
    }
  }
);
</script>
